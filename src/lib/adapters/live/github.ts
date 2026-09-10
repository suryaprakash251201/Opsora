import type { Snapshot, SourceAdapter } from "@/lib/adapters/types";
import type {
  GithubActivity,
  GithubIssue,
  GithubPull,
  GithubRepo,
  GithubSnapshot,
} from "@/lib/mock/github";

const API = "https://api.github.com";
const REPO_LIMIT = 6;
const PR_LIMIT = 5;
const ISSUE_LIMIT = 8;
const ACTIVITY_LIMIT = 10;
const CACHE_TTL_MS = 180_000;

/* ------------------------------------------------------------------ */
/* Raw API shapes (only the fields we use)                             */
/* ------------------------------------------------------------------ */

interface ApiUser {
  login: string;
  name: string | null;
}

interface ApiRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  archived: boolean;
  pushed_at: string;
}

interface ApiCommit {
  sha: string;
  commit: {
    message: string;
    author: { name?: string; date?: string } | null;
  };
  author: { login: string } | null;
}

interface ApiRun {
  name: string;
  status: string;
  conclusion: string | null;
  updated_at: string;
}

interface ApiRunsResponse {
  workflow_runs: ApiRun[];
}

interface ApiSearchItem {
  number: number;
  title: string;
  user: { login: string } | null;
  created_at: string;
  draft?: boolean;
  comments: number;
  labels: { name: string }[];
  repository_url: string;
  pull_request?: { url: string };
}

interface ApiSearchResponse {
  items: ApiSearchItem[];
}

interface ApiPullDetail {
  additions: number;
  deletions: number;
  draft: boolean;
  head: { sha: string };
}

interface ApiStatusResponse {
  state: "success" | "failure" | "error" | "pending";
}

/* ------------------------------------------------------------------ */
/* Pure mapping helpers (unit-tested)                                  */
/* ------------------------------------------------------------------ */

export function mapCi(run?: ApiRun): GithubRepo["ci"] {
  if (!run) {
    return { status: "none", workflow: "-", at: new Date(0).toISOString() };
  }

  const status: GithubRepo["ci"]["status"] =
    run.status !== "completed"
      ? "running"
      : run.conclusion === "success"
        ? "passing"
        : run.conclusion === null
          ? "running"
          : "failing";

  return {
    status,
    workflow: run.name,
    at: run.updated_at,
  };
}

export function mapLastCommit(commit?: ApiCommit): GithubRepo["lastCommit"] {
  if (!commit) {
    return {
      message: "No commits yet",
      sha: "-------",
      author: "unknown",
      at: new Date(0).toISOString(),
    };
  }

  return {
    message: commit.commit.message.split("\n")[0],
    sha: commit.sha.slice(0, 7),
    author: commit.author?.login ?? commit.commit.author?.name ?? "unknown",
    at: commit.commit.author?.date ?? new Date().toISOString(),
  };
}

export function mapRepo(
  repo: ApiRepo,
  commit?: ApiCommit,
  run?: ApiRun,
): GithubRepo {
  return {
    id: repo.name,
    name: repo.name,
    description: repo.description ?? "No description",
    language: repo.language ?? "-",
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    openPulls: 0,
    defaultBranch: repo.default_branch,
    lastCommit: mapLastCommit(commit),
    ci: mapCi(run),
    deployment: { status: "none", environment: "-", at: repo.pushed_at },
  };
}

export function mapChecks(state: ApiStatusResponse["state"]): GithubPull["checks"] {
  if (state === "success") return "passing";
  if (state === "failure" || state === "error") return "failing";
  return "running";
}

function repoNameFromUrl(repositoryUrl: string): string {
  const parts = repositoryUrl.split("/");
  return parts[parts.length - 1] ?? "unknown";
}

export function mapPull(
  item: ApiSearchItem,
  reviewRequested: boolean,
  detail?: ApiPullDetail,
  status?: ApiStatusResponse,
): GithubPull {
  return {
    id: item.number,
    repo: repoNameFromUrl(item.repository_url),
    title: item.title,
    author: item.user?.login ?? "unknown",
    draft: detail?.draft ?? item.draft ?? false,
    reviewRequested,
    checks: status ? mapChecks(status.state) : "running",
    additions: detail?.additions ?? 0,
    deletions: detail?.deletions ?? 0,
    createdAt: item.created_at,
  };
}

export function mapIssue(item: ApiSearchItem): GithubIssue {
  return {
    id: item.number,
    repo: repoNameFromUrl(item.repository_url),
    title: item.title,
    author: item.user?.login ?? "unknown",
    labels: item.labels.map((label) => label.name),
    comments: item.comments,
    createdAt: item.created_at,
  };
}

/* ------------------------------------------------------------------ */
/* Fetching                                                            */
/* ------------------------------------------------------------------ */

function createClient(token: string) {
  return async function github<T>(path: string): Promise<T> {
    const response = await fetch(`${API}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "opsora-dashboard",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `GitHub ${path} responded with ${response.status}: ${body.slice(0, 120)}`,
      );
    }

    return response.json() as Promise<T>;
  };
}

async function fetchGithubSnapshot(token: string): Promise<GithubSnapshot> {
  const github = createClient(token);
  const user = await github<ApiUser>("/user");

  const rawRepos = (
    await github<ApiRepo[]>(
      `/user/repos?sort=pushed&direction=desc&per_page=${REPO_LIMIT}&affiliation=owner`,
    )
  ).filter((repo) => !repo.archived);

  const repos = await Promise.all(
    rawRepos.map(async (repo) => {
      const [commits, runs] = await Promise.all([
        github<ApiCommit[]>(
          `/repos/${repo.full_name}/commits?per_page=1`,
        ).catch(() => []),
        github<ApiRunsResponse>(
          `/repos/${repo.full_name}/actions/runs?per_page=1&branch=${repo.default_branch}`,
        ).catch(() => ({ workflow_runs: [] })),
      ]);

      return mapRepo(repo, commits[0], runs.workflow_runs[0]);
    }),
  );

  const [reviewSearch, authoredSearch, issueSearch] = await Promise.all([
    github<ApiSearchResponse>(
      `/search/issues?q=${encodeURIComponent(
        `is:pr is:open review-requested:${user.login}`,
      )}&per_page=${PR_LIMIT}`,
    ).catch(() => ({ items: [] })),
    github<ApiSearchResponse>(
      `/search/issues?q=${encodeURIComponent(
        `is:pr is:open author:${user.login} -review-requested:${user.login}`,
      )}&per_page=${PR_LIMIT}`,
    ).catch(() => ({ items: [] })),
    github<ApiSearchResponse>(
      `/search/issues?q=${encodeURIComponent(
        `is:issue is:open author:${user.login}`,
      )}&per_page=${ISSUE_LIMIT}`,
    ).catch(() => ({ items: [] })),
  ]);

  const pulls = await Promise.all([
    ...reviewSearch.items.map(async (item) => enrichPull(item, true)),
    ...authoredSearch.items.map(async (item) => enrichPull(item, false)),
  ]);

  async function enrichPull(
    item: ApiSearchItem,
    reviewRequested: boolean,
  ): Promise<GithubPull> {
    const repo = repoNameFromUrl(item.repository_url);
    const detail = await github<ApiPullDetail>(
      `/repos/${repo}/pulls/${item.number}`,
    ).catch(() => undefined);

    const status = detail
      ? await github<ApiStatusResponse>(
          `/repos/${repo}/commits/${detail.head.sha}/status`,
        ).catch(() => undefined)
      : undefined;

    return mapPull(item, reviewRequested, detail, status);
  }

  for (const repo of repos) {
    repo.openPulls = pulls.filter((pull) => pull.repo === repo.id).length;
  }

  const issues = issueSearch.items.map(mapIssue);

  const activity: GithubActivity[] = [
    ...repos.map((repo) => ({
      id: `commit-${repo.id}-${repo.lastCommit.sha}`,
      kind: "commit" as const,
      repo: repo.name,
      text: `${repo.lastCommit.sha} ${repo.lastCommit.message}`,
      at: repo.lastCommit.at,
    })),
    ...pulls.map((pull) => ({
      id: `pull-${pull.repo}-${pull.id}`,
      kind: "pull" as const,
      repo: pull.repo,
      text: `#${pull.id} ${pull.title} · ${pull.author}`,
      at: pull.createdAt,
    })),
    ...issues.map((issue) => ({
      id: `issue-${issue.repo}-${issue.id}`,
      kind: "issue" as const,
      repo: issue.repo,
      text: `#${issue.id} ${issue.title}`,
      at: issue.createdAt,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, ACTIVITY_LIMIT);

  const today = new Date().toISOString().slice(0, 10);
  const commitsToday = repos.filter((repo) =>
    repo.lastCommit.at.startsWith(today),
  ).length;

  return {
    user: { login: user.login, name: user.name ?? user.login },
    stats: {
      repos: repos.length,
      openPulls: pulls.length,
      openIssues: issues.length,
      commitsToday,
    },
    repos,
    pulls,
    issues,
    activity,
    updatedAt: new Date().toISOString(),
  };
}

export function createGithubAdapter(token: string): SourceAdapter<GithubSnapshot> {
  let cache: { at: number; data: GithubSnapshot } | null = null;

  return {
    id: "github",
    label: "GitHub",
    description: "Live repositories, pull requests and Actions",
    mode: "live",
    async getSnapshot(): Promise<Snapshot<GithubSnapshot>> {
      const started = performance.now();

      if (!cache || Date.now() - cache.at >= CACHE_TTL_MS) {
        cache = { at: Date.now(), data: await fetchGithubSnapshot(token) };
      }

      return {
        source: "github",
        data: cache.data,
        fetchedAt: new Date(cache.at).toISOString(),
        status: "ok",
        mode: "live",
        latencyMs: Math.round(performance.now() - started),
      };
    },
  };
}
