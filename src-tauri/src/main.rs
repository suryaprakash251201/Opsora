#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

//! Opsora desktop shell.
//!
//! Responsibilities:
//! - pick a free localhost port and boot the embedded Next.js standalone
//!   server (shipped as a Tauri resource) with a bundled or system Node.js,
//! - show a themed splash page while the server warms up, then navigate the
//!   webview to it,
//! - keep external links out of the app window (they open in the OS browser),
//! - make sure only one instance runs and window geometry is remembered,
//! - read desktop source configuration from `opsora.env` in the app data dir.

use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream, ToSocketAddrs};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::{
    webview::NewWindowResponse, AppHandle, Manager, Url, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder,
};

const WINDOW_LABEL: &str = "main";
const DEFAULT_PORT: u16 = 9942;
const READY_TIMEOUT: Duration = Duration::from_secs(45);
const POLL_INTERVAL: Duration = Duration::from_millis(250);

/// The bundled Next.js standalone server, killed when the app exits.
struct ServerProcess(Mutex<Option<Child>>);

/* ————————————————————————— ports ————————————————————————— */

fn env_port() -> Option<u16> {
    std::env::var("OPSORA_PORT")
        .ok()?
        .trim()
        .parse::<u16>()
        .ok()
        .filter(|port| *port > 0)
}

fn port_is_free(port: u16) -> bool {
    TcpListener::bind(("127.0.0.1", port)).is_ok()
}

fn ephemeral_port() -> u16 {
    TcpListener::bind(("127.0.0.1", 0))
        .and_then(|listener| listener.local_addr())
        .map(|address| address.port())
        .unwrap_or(DEFAULT_PORT)
}

fn port_open(port: u16) -> bool {
    let addr = format!("127.0.0.1:{port}");
    addr.to_socket_addrs()
        .ok()
        .and_then(|mut addrs| addrs.next())
        .is_some_and(|addr| TcpStream::connect_timeout(&addr, Duration::from_millis(300)).is_ok())
}

/// Cheap probe that tells an Opsora server apart from an unrelated service
/// squatting on the default port.
fn responds_like_opsora(port: u16) -> bool {
    let address = match format!("127.0.0.1:{port}")
        .to_socket_addrs()
        .ok()
        .and_then(|mut addrs| addrs.next())
    {
        Some(address) => address,
        None => return false,
    };

    let mut stream = match TcpStream::connect_timeout(&address, Duration::from_millis(400)) {
        Ok(stream) => stream,
        Err(_) => return false,
    };
    let _ = stream.set_read_timeout(Some(Duration::from_millis(900)));

    let request = format!(
        "GET /api/status HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nAccept: application/json\r\nConnection: close\r\n\r\n"
    );
    if stream.write_all(request.as_bytes()).is_err() {
        return false;
    }

    let mut response = String::new();
    let _ = stream.take(128 * 1024).read_to_string(&mut response);
    response.contains("\"uptimeSeconds\"") && response.contains("\"sources\"")
}

/// Pick the port the app should talk to:
/// 1. `OPSORA_PORT` always wins,
/// 2. otherwise prefer 9942 when free,
/// 3. reuse it when another Opsora server already owns it,
/// 4. fall back to a random free port instead of hijacking a stranger.
fn choose_port() -> u16 {
    if let Some(port) = env_port() {
        return port;
    }
    if port_is_free(DEFAULT_PORT) || responds_like_opsora(DEFAULT_PORT) {
        return DEFAULT_PORT;
    }
    ephemeral_port()
}

fn wait_for_server(port: u16, timeout: Duration) -> bool {
    let start = Instant::now();
    while start.elapsed() < timeout {
        if port_open(port) {
            return true;
        }
        std::thread::sleep(POLL_INTERVAL);
    }
    port_open(port)
}

fn server_url(port: u16) -> Url {
    format!("http://localhost:{port}")
        .parse()
        .expect("localhost URL is always valid")
}

/* ————————————————————————— Node runtime ————————————————————————— */

fn node_binary_name() -> &'static str {
    if cfg!(windows) {
        "node.exe"
    } else {
        "node"
    }
}

fn find_on_path(name: &str) -> Option<PathBuf> {
    let path = std::env::var_os("PATH")?;
    std::env::split_paths(&path)
        .map(|directory| directory.join(name))
        .find(|candidate| candidate.is_file())
}

fn version_tuple(name: &str) -> Vec<u32> {
    name.trim_start_matches('v')
        .split(['.', '-'])
        .map(|part| part.parse::<u32>().unwrap_or(0))
        .collect()
}

/// Newest versioned Node install inside `root` (nvm/fnm style layouts).
fn newest_node_in(root: &Path, suffix: &[&str]) -> Option<PathBuf> {
    let mut best: Option<(Vec<u32>, PathBuf)> = None;
    for entry in fs::read_dir(root).ok()?.flatten() {
        let mut candidate = entry.path();
        for part in suffix {
            candidate = candidate.join(part);
        }
        if candidate.is_file() {
            let version = version_tuple(&entry.file_name().to_string_lossy());
            if best.as_ref().is_none_or(|(current, _)| version > *current) {
                best = Some((version, candidate));
            }
        }
    }
    best.map(|(_, path)| path)
}

fn home_dir() -> Option<PathBuf> {
    std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .map(PathBuf::from)
}

/// Well-known Node.js install locations, for GUI apps that do not inherit
/// the user's shell PATH (a classic Windows/macOS desktop problem).
fn common_node_paths() -> Vec<PathBuf> {
    let name = node_binary_name();
    let mut paths = Vec::new();

    #[cfg(windows)]
    {
        for variable in ["ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA"] {
            if let Some(base) = std::env::var_os(variable) {
                paths.push(PathBuf::from(&base).join("nodejs").join(name));
            }
        }
        if let Some(appdata) = std::env::var_os("APPDATA") {
            paths.push(PathBuf::from(&appdata).join("nvm").join(name));
            if let Some(newest) = newest_node_in(&PathBuf::from(&appdata).join("nvm"), &[name]) {
                paths.push(newest);
            }
        }
        if let Some(local) = std::env::var_os("LOCALAPPDATA") {
            if let Some(newest) = newest_node_in(
                &PathBuf::from(&local).join("fnm").join("node-versions"),
                &["installation", name],
            ) {
                paths.push(newest);
            }
        }
        if let Some(home) = home_dir() {
            paths.push(
                home.join("scoop")
                    .join("apps")
                    .join("nodejs")
                    .join("current")
                    .join(name),
            );
        }
    }

    #[cfg(not(windows))]
    {
        for base in [
            "/usr/local/bin",
            "/usr/bin",
            "/opt/homebrew/bin",
            "/snap/bin",
        ] {
            paths.push(PathBuf::from(base).join(name));
        }
        if let Some(home) = home_dir() {
            paths.push(home.join(".volta").join("bin").join(name));
            paths.push(home.join(".local").join("bin").join(name));
            if let Some(newest) = newest_node_in(
                &home.join(".nvm").join("versions").join("node"),
                &["bin", name],
            ) {
                paths.push(newest);
            }
            if let Some(newest) = newest_node_in(
                &home
                    .join(".local")
                    .join("share")
                    .join("fnm")
                    .join("node-versions"),
                &["installation", "bin", name],
            ) {
                paths.push(newest);
            }
        }
    }

    paths
}

/// Resolution order: runtime bundled with the installer → PATH → common
/// install locations. Returns `None` when the machine has no usable Node.
fn resolve_node(app: &AppHandle) -> Option<PathBuf> {
    if let Ok(resource_dir) = app.path().resource_dir() {
        let bundled = resource_dir
            .join("bundled-server")
            .join("runtime")
            .join(node_binary_name());
        if bundled.is_file() {
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                if let Ok(metadata) = fs::metadata(&bundled) {
                    let mut permissions = metadata.permissions();
                    if permissions.mode() & 0o111 == 0 {
                        permissions.set_mode(0o755);
                        let _ = fs::set_permissions(&bundled, permissions);
                    }
                }
            }
            return Some(bundled);
        }
    }

    find_on_path(node_binary_name())
        .or_else(|| common_node_paths().into_iter().find(|path| path.is_file()))
}

/* ————————————————————————— desktop config ————————————————————————— */

const CONFIG_TEMPLATE: &str = r#"# Opsora desktop configuration
#
# Every source is optional — unconfigured sources show honest empty states.
# Edit this file, then restart the app. Keep it private (it can hold tokens).
#
# ---------------------------------------------------------------- GitHub
# Fine-grained or classic PAT with read-only repo access.
# GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
#
# ---------------------------------------------------------------- Pi-hole
# PIHOLE_URL=http://192.168.1.10
# PIHOLE_PASSWORD=your-admin-password
#
# ---------------------------------------------------------------- Docker
# Auto-detected on Linux/macOS at /var/run/docker.sock.
# DOCKER_SOCKET=/var/run/docker.sock
#
# ---------------------------------------------------------------- Server alerts
# TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
# TELEGRAM_CHAT_ID=123456789
# DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
#
# ---------------------------------------------------------------- Google Calendar
# GOOGLE_CLIENT_ID=...apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=...
# GOOGLE_REFRESH_TOKEN=...
# GOOGLE_CALENDAR_ID=primary
"#;

fn app_config_path(app: &AppHandle) -> Option<PathBuf> {
    app.path()
        .app_data_dir()
        .ok()
        .map(|directory| directory.join("opsora.env"))
}

/// Write a commented template on first launch so users have a place to put
/// tokens without touching their shell environment.
fn ensure_config_template(path: &Path) {
    if path.exists() {
        return;
    }
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    if fs::write(path, CONFIG_TEMPLATE).is_ok() {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = fs::set_permissions(path, fs::Permissions::from_mode(0o600));
        }
        eprintln!(
            "[opsora] wrote desktop config template → {}",
            path.display()
        );
    }
}

fn parse_env_file(contents: &str) -> Vec<(String, String)> {
    let mut entries = Vec::new();
    for line in contents.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let line = line.strip_prefix("export ").unwrap_or(line);
        let Some((key, value)) = line.split_once('=') else {
            continue;
        };
        let key = key.trim();
        if key.is_empty() || !key.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
            continue;
        }
        let value = value.trim().trim_matches('"').trim_matches('\'').trim();
        if value.is_empty() {
            continue;
        }
        entries.push((key.to_string(), value.to_string()));
    }
    entries
}

fn read_config(path: &Path) -> Vec<(String, String)> {
    fs::read_to_string(path)
        .map(|contents| parse_env_file(&contents))
        .unwrap_or_default()
}

/* ————————————————————————— bundled server ————————————————————————— */

/// Path to the staged Next.js standalone entrypoint inside the bundle.
fn bundled_server_entry(app: &AppHandle) -> Option<PathBuf> {
    let entry = app
        .path()
        .resource_dir()
        .ok()?
        .join("bundled-server")
        .join("server.js");
    entry.is_file().then_some(entry)
}

fn spawn_bundled_server(app: &AppHandle, port: u16) -> Result<Child, String> {
    let entry = bundled_server_entry(app)
        .ok_or_else(|| "The bundled server is missing from this installation.".to_string())?;
    let home = entry
        .parent()
        .ok_or_else(|| "The bundled server path is invalid.".to_string())?
        .to_path_buf();

    // Persist server data (SQLite, agent metrics) in the OS app-data dir
    // instead of next to the binary, so updates never wipe user data.
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Cannot resolve the app data directory: {error}"))?
        .join("server-data");
    fs::create_dir_all(&data_dir)
        .map_err(|error| format!("Cannot create {}: {error}", data_dir.display()))?;

    let node = resolve_node(app).ok_or_else(|| {
        "Opsora needs Node.js 22+ to run its server, and none was found.\n\n\
         Install Node.js from https://nodejs.org, or use an Opsora installer \
         that bundles the runtime."
            .to_string()
    })?;

    let config_path = app_config_path(app)
        .ok_or_else(|| "Cannot resolve the desktop config path.".to_string())?;

    let mut command = Command::new(node);
    command
        .arg(&entry)
        .current_dir(&home)
        .env("NODE_ENV", "production")
        // Config file values are injected first so the runtime contract
        // (PORT / HOSTNAME / data dir) always wins over `opsora.env`.
        .envs(read_config(&config_path))
        .env("PORT", port.to_string())
        .env("HOSTNAME", "127.0.0.1")
        .env("OPSORA_DATA_DIR", &data_dir)
        .env("OPSORA_CONFIG_FILE", &config_path)
        .env("OPSORA_DESKTOP", "1")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    // Never flash a console window on Windows.
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    command.spawn().map_err(|error| {
        format!(
            "Could not start the Opsora server with {}: {error}",
            entry.display()
        )
    })
}

/* ————————————————————————— window ————————————————————————— */

/// Open `http`/`https`/`mailto` links in the user's default browser.
fn open_external(url: &str) {
    if !(url.starts_with("http://") || url.starts_with("https://") || url.starts_with("mailto:")) {
        return;
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        let _ = Command::new("cmd")
            .args(["/C", "start", "", url])
            .creation_flags(CREATE_NO_WINDOW)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();
    }

    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open")
            .arg(url)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let _ = Command::new("xdg-open")
            .arg(url)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();
    }
}

fn is_local_url(url: &Url, port: u16) -> bool {
    let Some(host) = url.host_str() else {
        return false;
    };
    let local_host = host == "localhost" || host == "127.0.0.1" || host == "::1";
    local_host && url.port().is_none_or(|url_port| url_port == port)
}

/// Tauri-internal pages: `tauri://localhost` on Linux/macOS and
/// `http://tauri.localhost` on Windows, plus the IPC/asset bridges.
fn is_tauri_internal(url: &Url) -> bool {
    matches!(url.scheme(), "tauri" | "about" | "data" | "ipc")
        || url.host_str() == Some("tauri.localhost")
        || url.host_str() == Some("asset.localhost")
}

/// The window starts on the bundled splash page (release) or the dev server
/// (debug). Navigation stays on the local server; everything else is handed
/// to the OS browser.
fn create_window(app: &AppHandle, port: u16) -> tauri::Result<WebviewWindow> {
    let initial_url = if cfg!(debug_assertions) {
        WebviewUrl::External(server_url(port))
    } else {
        WebviewUrl::App("index.html".into())
    };

    WebviewWindowBuilder::new(app, WINDOW_LABEL, initial_url)
        .title("Opsora")
        .inner_size(1400.0, 900.0)
        .min_inner_size(1024.0, 640.0)
        .center()
        .visible(true)
        .on_navigation(move |url| {
            if is_tauri_internal(url) || is_local_url(url, port) {
                return true;
            }
            open_external(url.as_str());
            false
        })
        .on_new_window(move |url, _features| {
            open_external(url.as_str());
            NewWindowResponse::Deny
        })
        .build()
}

fn set_splash_status(window: &WebviewWindow, text: &str) {
    let payload = serde_json::to_string(text).unwrap_or_else(|_| "\"\"".to_string());
    let _ = window.eval(format!("window.opsora && window.opsora.status({payload});"));
}

fn show_error(window: &WebviewWindow, message: &str) {
    let payload = serde_json::to_string(message).unwrap_or_else(|_| "\"\"".to_string());
    let _ = window.eval(format!("window.opsora && window.opsora.fail({payload});"));
    let _ = window.show();
    let _ = window.set_focus();
}

/// Wait for the server in the background, then swap the splash for the app.
fn reveal_when_ready(app: &AppHandle, port: u16) {
    let handle = app.clone();
    std::thread::spawn(move || {
        let ready = wait_for_server(port, READY_TIMEOUT);
        let Some(window) = handle.get_webview_window(WINDOW_LABEL) else {
            return;
        };

        if ready {
            eprintln!("[opsora] server ready → http://localhost:{port}");
            // In dev the webview already points at the dev server.
            if !cfg!(debug_assertions) {
                set_splash_status(&window, "Loading your dashboard…");
                let _ = window.navigate(server_url(port));
            }
            let _ = window.show();
            let _ = window.set_focus();
        } else {
            eprintln!(
                "[opsora] server did not answer within {}s",
                READY_TIMEOUT.as_secs()
            );
            show_error(
                &window,
                "The Opsora server did not start in time.\n\n\
                 Check that port 9942 (or OPSORA_PORT) is free and that \
                 Node.js 22+ is available, then restart the app.",
            );
        }
    });
}

fn main() {
    let port = choose_port();

    tauri::Builder::default()
        // Must be the first plugin so a second launch focuses the first window.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            eprintln!("[opsora] second instance detected — focusing the main window");
            if let Some(window) = app.get_webview_window(WINDOW_LABEL) {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        // Remember size/position between launches.
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .manage(ServerProcess(Mutex::new(None)))
        .setup(move |app| {
            let handle = app.handle().clone();

            if let Some(config_path) = app_config_path(&handle) {
                ensure_config_template(&config_path);
            }

            create_window(&handle, port)?;

            let needs_spawn = !cfg!(debug_assertions) && !port_open(port);
            if needs_spawn {
                if let Some(window) = handle.get_webview_window(WINDOW_LABEL) {
                    set_splash_status(&window, "Starting the Opsora server…");
                }
                match spawn_bundled_server(&handle, port) {
                    Ok(child) => {
                        if let Ok(mut guard) = app.state::<ServerProcess>().0.lock() {
                            *guard = Some(child);
                        }
                    }
                    Err(message) => {
                        eprintln!("[opsora] {message}");
                        if let Some(window) = handle.get_webview_window(WINDOW_LABEL) {
                            show_error(&window, &message);
                        }
                        return Ok(());
                    }
                }
            } else if let Some(window) = handle.get_webview_window(WINDOW_LABEL) {
                set_splash_status(&window, "Connecting to the running server…");
            }

            reveal_when_ready(&handle, port);
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("failed to build the Opsora desktop shell")
        .run(|app, event| {
            if matches!(event, tauri::RunEvent::Exit) {
                if let Some(state) = app.try_state::<ServerProcess>() {
                    let mut guard = match state.0.lock() {
                        Ok(guard) => guard,
                        Err(_) => return,
                    };
                    if let Some(mut child) = guard.take() {
                        let _ = child.kill();
                        let _ = child.wait();
                    }
                }
            }
        });
}
