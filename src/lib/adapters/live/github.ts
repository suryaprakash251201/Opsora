import type { Snapshot, SourceAdapter } from "@/lib/adapters/types";
import type {
  GithubActivity,
  GithubCommit,
  GithubIssue,
  GithubLanguage,
  GithubPull,
  GithubRelease,
  GithubRepo,
  GithubRun,
  GithubSnapshot,
} from "@/lib/types/github";

const API = "https://api.github.com";

/**
 * Request budget: the snapshot is cached for `CACHE_TTL_MS`, and per cycle we
 * issue roughly `ENRICH_LIMIT * 3 + DEPLOY_LIMIT * 2 + RELEASE_LIMIT + 5`
 * calls. With the defaults that is ~85 calls every 3 minutes, well inside the
 * 5,000/hour REST limit for a personal token.
 */
const MAX_REPOS = 100;
const ENRICH_LIMIT = 20;
const DEPLOY_LIMIT = 6;
const RELEASE_LIMIT = 6;
const COMMITS_PER_REPO = 4;
const RUNS_PER_REPO = 5;
const PR_PER_REPO = 6;
const RUNS_LIMIT = 24;
const ACTIVITY_LIMIT = 24;
const PR_SEARCH_LIMIT = 8;
const ISSUE_SEARCH_LIMIT = 10;
const REVIEW_PR_LIMIT = 6;
const CACHE_TTL_MS = 180_000;

/* ------------------------------------------------------------------ */
/* Raw API shapes (only the fields we use)                             */
/* ------------------------------------------------------------------ */

interface ApiUser {
  login: string;
  name: string | null;
  avatar_url?: string;
}

interface ApiRepo {
  id: number;
  name: string;
  full_name: string;
  html_url?: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  watchers_count?: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  archived: boolean;
  private?: boolean;
  topics?: string[];
  pushed_at: string;
  updated_at?: string;
}

interface ApiCommit {
  sha: string;
  html_url?: string;
  commit: {
    message: string;
    author: { name?: string; date?: string } | null;
  };
  author: { login: string } | null;
}

interface ApiRun {
  id?: number;
  name: string;
  html_url?: string;
  status: string;
  conclusion: string | null;
  head_branch?: string;
  event?: string;
  run_attempt?: number;
  created_at?: string;
  updated_at: string;
  actor?: { login: string } | null;
}

interface ApiRunsResponse {
  workflow_runs: ApiRun[];
}

interface ApiSearchItem {
  number: number;
  title: string;
  html_url?: string;
  user: { login: string } | null;
  created_at: string;
  updated_at?: string;
  draft?: boolean;
  comments: number;
  labels: { name: string }[];
  assignees?: { login: string }[] | null;
  repository_url: string;
  pull_request?: { url: string };
}

interface ApiSearchResponse {
  total_count?: number;
  items: ApiSearchItem[];
}

interface ApiPullDetail {
  additions: number;
  deletions: number;
  changed_files?: number;
  draft: boolean;
  comments?: number;
  head: { sha: string; ref?: string };
  base?: { ref?: string };
  labels?: { name: string }[];
}

interface ApiRepoPull {
  number: number;
  title: string;
  html_url?: string;
  user: { login: string } | null;
  created_at: string;
  updated_at?: string;
  draft?: boolean;
  comments?: number;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  labels?: { name: string }[];
  base?: { ref?: string };
  head?: { ref?: string; sha?: string };
  requested_reviewers?: { login: string }[] | null;
}

interface ApiStatusResponse {
  state: "success" | "failure" | "error" | "pending";
}

interface ApiDeployment {
  id: number;
  environment: string;
  created_at: string;
  updated_at?: string;
  ref?: string;
}

interface ApiDeploymentStatus {
  state: string;
  created_at: string;
  environment_url?: string;
  log_url?: string;
}

interface ApiRelease {
  id: number;
  tag_name: string;
  name: string | null;
  html_url?: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  created_at: string;
  author?: { login: string } | null;
}

/* ------------------------------------------------------------------ */
/* Pure mapping helpers (unit-tested)                                  */
/* ------------------------------------------------------------------ */

export function mapCi(run?: ApiRun): GithubRepo["ci"] {
  if (!run) {
    return { status: "none", workflow: "-", at: new Date(0).toISOString(), url: "" };
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
    url: run.html_url ?? "",
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

export function mapCommit(commit: ApiCommit): GithubCommit {
  return {
    sha: commit.sha.slice(0, 7),
    message: commit.commit.message.split("\n")[0],
    author: commit.author?.login ?? commit.commit.author?.name ?? "unknown",
    at: commit.commit.author?.date ?? new Date().toISOString(),
    url: commit.html_url ?? "",
  };
}

export function mapRepo(
  repo: ApiRepo,
  commits: ApiCommit[] = [],
  runs: ApiRun[] = [],
  deployment?: GithubRepo["deployment"],
  openPulls = 0,
): GithubRepo {
  const latestRun = [...runs].sort((a, b) =>
    (b.updated_at ?? "").localeCompare(a.updated_at ?? ""),
  )[0];

  return {
    id: repo.full_name,
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url ?? "",
    description: repo.description ?? "No description",
    language: repo.language ?? "-",
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    watchers: repo.watchers_count ?? repo.stargazers_count,
    openIssues: repo.open_issues_count,
    openPulls,
    defaultBranch: repo.default_branch,
    isPrivate: Boolean(repo.private),
    archived: Boolean(repo.archived),
    topics: (repo.topics ?? []).slice(0, 6),
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at ?? repo.pushed_at,
    recentCommits: commits.map(mapCommit),
    lastCommit: mapLastCommit(commits[0]),
    ci: mapCi(latestRun),
    deployment:
      deployment ?? {
        status: "none",
        environment: "-",
        at: repo.pushed_at,
        url: "",
      },
  };
}

export function mapChecks(
  state: ApiStatusResponse["state"],
): GithubPull["checks"] {
  if (state === "success") return "passing";
  if (state === "failure" || state === "error") return "failing";
  return "running";
}

function repoNameFromUrl(repositoryUrl: string): string {
  const parts = repositoryUrl.split("/");
  return parts[parts.length - 1] ?? "unknown";
}

export function repoFullNameFromUrl(repositoryUrl: string): string {
  const match = repositoryUrl.match(/\/repos\/(.+?)\/?$/);
  return match?.[1] ?? repoNameFromUrl(repositoryUrl);
}

export function mapPull(
  item: ApiSearchItem,
  reviewRequested: boolean,
  detail?: ApiPullDetail,
  status?: ApiStatusResponse,
): GithubPull {
  const fullName = repoFullNameFromUrl(item.repository_url);

  return {
    id: item.number,
    repo: repoNameFromUrl(item.repository_url),
    repoFullName: fullName,
    url: item.html_url ?? `https://github.com/${fullName}/pull/${item.number}`,
    title: item.title,
    author: item.user?.login ?? "unknown",
    draft: detail?.draft ?? item.draft ?? false,
    reviewRequested,
    checks: status ? mapChecks(status.state) : "unknown",
    additions: detail?.additions ?? 0,
    deletions: detail?.deletions ?? 0,
    changedFiles: detail?.changed_files ?? 0,
    comments: detail?.comments ?? item.comments ?? 0,
    labels: (detail?.labels ?? item.labels ?? []).map((label) => label.name),
    base: detail?.base?.ref ?? "main",
    head: detail?.head?.ref ?? "",
    createdAt: item.created_at,
    updatedAt: item.updated_at ?? item.created_at,
  };
}

export function mapRepoPull(
  fullName: string,
  pull: ApiRepoPull,
  reviewRequested: boolean,
): GithubPull {
  return {
    id: pull.number,
    repo: fullName.split("/")[1] ?? fullName,
    repoFullName: fullName,
    url: pull.html_url ?? `https://github.com/${fullName}/pull/${pull.number}`,
    title: pull.title,
    author: pull.user?.login ?? "unknown",
    draft: Boolean(pull.draft),
    reviewRequested,
    checks: "unknown",
    additions: pull.additions ?? 0,
    deletions: pull.deletions ?? 0,
    changedFiles: pull.changed_files ?? 0,
    comments: pull.comments ?? 0,
    labels: (pull.labels ?? []).map((label) => label.name),
    base: pull.base?.ref ?? "main",
    head: pull.head?.ref ?? "",
    createdAt: pull.created_at,
    updatedAt: pull.updated_at ?? pull.created_at,
  };
}

export function mapIssue(item: ApiSearchItem): GithubIssue {
  const fullName = repoFullNameFromUrl(item.repository_url);

  return {
    id: item.number,
    repo: repoNameFromUrl(item.repository_url),
    repoFullName: fullName,
    url: item.html_url ?? `https://github.com/${fullName}/issues/${item.number}`,
    title: item.title,
    author: item.user?.login ?? "unknown",
    labels: item.labels.map((label) => label.name),
    comments: item.comments,
    assignees: (item.assignees ?? []).map((assignee) => assignee.login),
    createdAt: item.created_at,
    updatedAt: item.updated_at ?? item.created_at,
  };
}

export function mapRun(fullName: string, run: ApiRun): GithubRun {
  return {
    id: run.id ?? Math.abs(hash(`${fullName}-${run.name}-${run.updated_at}`)),
    repo: fullName.split("/")[1] ?? fullName,
    repoFullName: fullName,
    name: run.name,
    status: normalizeRunStatus(run.status),
    conclusion: normalizeConclusion(run.conclusion),
    branch: run.head_branch ?? "",
    event: run.event ?? "",
    actor: run.actor?.login ?? "",
    attempt: run.run_attempt ?? 1,
    url: run.html_url ?? "",
    createdAt: run.created_at ?? run.updated_at,
    updatedAt: run.updated_at,
  };
}

export function mapRelease(fullName: string, release: ApiRelease): GithubRelease {
  return {
    id: release.id,
    repo: fullName.split("/")[1] ?? fullName,
    repoFullName: fullName,
    tag: release.tag_name,
    name: release.name ?? release.tag_name,
    author: release.author?.login ?? "unknown",
    prerelease: release.prerelease,
    draft: release.draft,
    url: release.html_url ?? "",
    publishedAt: release.published_at ?? release.created_at,
  };
}

export function mapDeploymentState(
  state: string | undefined,
): GithubRepo["deployment"]["status"] {
  if (state === "success") return "success";
  if (state === "failure" || state === "error") return "failed";
  if (
    state === "in_progress" ||
    state === "queued" ||
    state === "pending"
  ) {
    return "in_progress";
  }
  return "none";
}

function normalizeRunStatus(status: string): GithubRun["status"] {
  switch (status) {
    case "in_progress":
    case "queued":
    case "pending":
    case "waiting":
    case "requested":
      return status;
    default:
      return "completed";
  }
}

function normalizeConclusion(
  conclusion: string | null,
): GithubRun["conclusion"] {
  switch (conclusion) {
    case "success":
    case "failure":
    case "cancelled":
    case "skipped":
    case "neutral":
    case "timed_out":
    case "action_required":
    case "startup_failure":
    case "stale":
      return conclusion;
    default:
      return null;
  }
}

/** Tiny deterministic hash so synthetic run ids stay stable across polls. */
function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) | 0;
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Fetching                                                            */
/* ------------------------------------------------------------------ */

async function gh<T>(token: string, path: string): Promise<T> {
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
}

/** Follows pagination until `max` items are collected (bounded to 10 pages). */
async function ghAll<T>(
  token: string,
  path: string,
  max: number,
): Promise<T[]> {
  const results: T[] = [];
  const perPage = 100;

  for (let page = 1; results.length < max && page <= 10; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const batch = await gh<T[]>(
      token,
      `${path}${separator}per_page=${perPage}&page=${page}`,
    );
    results.push(...batch);
    if (batch.length < perPage) break;
  }

  return results.slice(0, max);
}

async function fetchDeployment(
  token: string,
  fullName: string,
): Promise<GithubRepo["deployment"] | undefined> {
  const deployments = await gh<ApiDeployment[]>(
    token,
    `/repos/${fullName}/deployments?per_page=1`,
  );
  const deployment = deployments[0];
  if (!deployment) return undefined;

  const statuses = await gh<ApiDeploymentStatus[]>(
    token,
    `/repos/${fullName}/deployments/${deployment.id}/statuses?per_page=1`,
  ).catch(() => []);
  const status = statuses[0];

  return {
    status: mapDeploymentState(status?.state),
    environment: deployment.environment ?? "-",
    at: status?.created_at ?? deployment.updated_at ?? deployment.created_at,
    url: status?.environment_url ?? status?.log_url ?? "",
  };
}

interface RepoEnrichment {
  repo: ApiRepo;
  commits: ApiCommit[];
  runs: ApiRun[];
  pulls: ApiRepoPull[];
  deployment?: GithubRepo["deployment"];
  releases: ApiRelease[];
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const id = key(item);
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(item);
  }
  return result;
}

async function fetchGithubSnapshot(token: string): Promise<GithubSnapshot> {
  const user = await gh<ApiUser>(token, "/user");

  /* 1. Every accessible repository, most recently pushed first. */
  const rawRepos = await ghAll<ApiRepo>(
    token,
    "/user/repos?sort=pushed&direction=desc&affiliation=owner,organization_member,collaborator",
    MAX_REPOS,
  );

  /* 2. Enrich the most recently pushed repositories with detail. */
  const enrichTargets = rawRepos.slice(0, ENRICH_LIMIT);
  const enrichments = await Promise.all(
    enrichTargets.map(async (repo, index): Promise<RepoEnrichment> => {
      const [commits, runsResponse, pulls, deployment, releases] =
        await Promise.all([
          gh<ApiCommit[]>(
            token,
            `/repos/${repo.full_name}/commits?per_page=${COMMITS_PER_REPO}`,
          ).catch(() => []),
          gh<ApiRunsResponse>(
            token,
            `/repos/${repo.full_name}/actions/runs?per_page=${RUNS_PER_REPO}&branch=${repo.default_branch}`,
          ).catch(() => ({ workflow_runs: [] })),
          gh<ApiRepoPull[]>(
            token,
            `/repos/${repo.full_name}/pulls?state=open&sort=updated&direction=desc&per_page=${PR_PER_REPO}`,
          ).catch(() => []),
          index < DEPLOY_LIMIT
            ? fetchDeployment(token, repo.full_name).catch(() => undefined)
            : Promise.resolve(undefined),
          index < RELEASE_LIMIT
            ? gh<ApiRelease[]>(
                token,
                `/repos/${repo.full_name}/releases?per_page=1`,
              ).catch(() => [])
            : Promise.resolve([]),
        ]);

      return {
        repo,
        commits,
        runs: runsResponse.workflow_runs,
        pulls,
        deployment,
        releases,
      };
    }),
  );

  const enrichmentByRepo = new Map(
    enrichments.map((entry) => [entry.repo.full_name, entry]),
  );

  /* 3. Open pull requests discovered directly on every enriched repo. */
  const repoPulls: GithubPull[] = enrichments.flatMap((entry) =>
    entry.pulls.map((pull) =>
      mapRepoPull(
        entry.repo.full_name,
        pull,
        Boolean(
          pull.requested_reviewers?.some(
            (reviewer) => reviewer.login === user.login,
          ),
        ),
      ),
    ),
  );

  /* 4. Cross-repo searches: review requests, authored PRs, assigned issues. */
  const [reviewSearch, authoredSearch, issueSearch] = await Promise.all([
    gh<ApiSearchResponse>(
      token,
      `/search/issues?q=${encodeURIComponent(
        `is:pr is:open review-requested:${user.login}`,
      )}&sort=updated&order=desc&per_page=${REVIEW_PR_LIMIT}`,
    ).catch(() => ({ items: [] })),
    gh<ApiSearchResponse>(
      token,
      `/search/issues?q=${encodeURIComponent(
        `is:pr is:open author:${user.login}`,
      )}&sort=updated&order=desc&per_page=${PR_SEARCH_LIMIT}`,
    ).catch(() => ({ items: [] })),
    gh<ApiSearchResponse>(
      token,
      `/search/issues?q=${encodeURIComponent(
        `is:issue is:open involves:${user.login}`,
      )}&sort=updated&order=desc&per_page=${ISSUE_SEARCH_LIMIT}`,
    ).catch(() => ({ items: [] })),
  ]);

  async function enrichSearchPull(
    item: ApiSearchItem,
    reviewRequested: boolean,
  ): Promise<GithubPull> {
    const fullName = repoFullNameFromUrl(item.repository_url);
    const detail = await gh<ApiPullDetail>(
      token,
      `/repos/${fullName}/pulls/${item.number}`,
    ).catch(() => undefined);

    const status = detail
      ? await gh<ApiStatusResponse>(
          token,
          `/repos/${fullName}/commits/${detail.head.sha}/status`,
        ).catch(() => undefined)
      : undefined;

    return mapPull(item, reviewRequested, detail, status);
  }

  const searchPulls = await Promise.all([
    ...reviewSearch.items.map((item) => enrichSearchPull(item, true)),
    ...authoredSearch.items.map((item) =>
      enrichSearchPull(
        item,
        reviewSearch.items.some(
          (review) =>
            repoFullNameFromUrl(review.repository_url) ===
              repoFullNameFromUrl(item.repository_url) &&
            review.number === item.number,
        ),
      ),
    ),
  ]);

  const pulls = uniqueBy(
    [...searchPulls, ...repoPulls],
    (pull) => `${pull.repoFullName}#${pull.id}`,
  ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  /* 5. Assemble repositories (all of them). */
  const repos: GithubRepo[] = rawRepos.map((repo) => {
    const entry = enrichmentByRepo.get(repo.full_name);
    return mapRepo(
      repo,
      entry?.commits ?? [],
      entry?.runs ?? [],
      entry?.deployment,
      entry?.pulls.length ?? 0,
    );
  });

  /* 6. Global CI/CD runs + releases from the enriched repos. */
  const runs = uniqueBy(
    enrichments.flatMap((entry) =>
      entry.runs.map((run) => mapRun(entry.repo.full_name, run)),
    ),
    (run) => `${run.repoFullName}#${run.id}`,
  )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, RUNS_LIMIT);

  const releases = enrichments
    .flatMap((entry) =>
      entry.releases.map((release) => mapRelease(entry.repo.full_name, release)),
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, RELEASE_LIMIT);

  /* 7. Issues. */
  const issues = uniqueBy(
    issueSearch.items.map(mapIssue),
    (issue) => `${issue.repoFullName}#${issue.id}`,
  ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  /* 8. Activity feed built from commits, PRs, issues, runs and releases. */
  const activity: GithubActivity[] = [
    ...enrichments.flatMap((entry) =>
      entry.commits.map((commit) => ({
        id: `commit-${entry.repo.full_name}-${commit.sha}`,
        kind: "commit" as const,
        repo: entry.repo.name,
        text: `${commit.sha.slice(0, 7)} ${commit.commit.message.split("\n")[0]}`,
        at: commit.commit.author?.date ?? new Date().toISOString(),
      })),
    ),
    ...pulls.map((pull) => ({
      id: `pull-${pull.repoFullName}-${pull.id}`,
      kind: "pull" as const,
      repo: pull.repo,
      text: `#${pull.id} ${pull.title} · ${pull.author}`,
      at: pull.updatedAt,
    })),
    ...issues.map((issue) => ({
      id: `issue-${issue.repoFullName}-${issue.id}`,
      kind: "issue" as const,
      repo: issue.repo,
      text: `#${issue.id} ${issue.title}`,
      at: issue.updatedAt,
    })),
    ...runs.map((run) => ({
      id: `action-${run.repoFullName}-${run.id}`,
      kind: "action" as const,
      repo: run.repo,
      text: `${run.name} · ${run.branch || run.event || "workflow"} · ${run.conclusion ?? run.status}`,
      at: run.updatedAt,
    })),
    ...releases.map((release) => ({
      id: `release-${release.repoFullName}-${release.id}`,
      kind: "release" as const,
      repo: release.repo,
      text: `${release.tag} ${release.name}`,
      at: release.publishedAt,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, ACTIVITY_LIMIT);

  /* 9. Aggregate stats + language breakdown. */
  const today = new Date().toISOString().slice(0, 10);
  const commitsToday = enrichments.reduce(
    (total, entry) =>
      total +
      entry.commits.filter((commit) =>
        (commit.commit.author?.date ?? "").startsWith(today),
      ).length,
    0,
  );

  const languageCounts = new Map<string, number>();
  for (const repo of repos) {
    if (!repo.language || repo.language === "-") continue;
    languageCounts.set(
      repo.language,
      (languageCounts.get(repo.language) ?? 0) + 1,
    );
  }

  const languages: GithubLanguage[] = [...languageCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    user: {
      login: user.login,
      name: user.name ?? user.login,
      avatarUrl: user.avatar_url ?? "",
    },
    stats: {
      repos: repos.length,
      openPulls: pulls.length,
      openIssues: issues.length,
      commitsToday,
      stars: repos.reduce((total, repo) => total + repo.stars, 0),
      failingWorkflows: repos.filter((repo) => repo.ci.status === "failing")
        .length,
      runningWorkflows: runs.filter((run) => run.status !== "completed").length,
      releases: releases.length,
    },
    repos,
    pulls,
    issues,
    runs,
    releases,
    languages,
    activity,
    updatedAt: new Date().toISOString(),
  };
}

export function createGithubAdapter(token: string): SourceAdapter<GithubSnapshot> {
  let cache: { at: number; data: GithubSnapshot } | null = null;

  return {
    id: "github",
    label: "GitHub",
    description: "Repositories, pull requests, issues, Actions and releases",
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
