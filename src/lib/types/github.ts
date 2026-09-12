export interface GithubCommit {
  sha: string;
  message: string;
  author: string;
  at: string;
  url: string;
}

export interface GithubRepo {
  /** GitHub `full_name` (owner/repo) — unique across accounts and orgs. */
  id: string;
  name: string;
  fullName: string;
  /** HTML URL on github.com. */
  url: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  openPulls: number;
  defaultBranch: string;
  isPrivate: boolean;
  archived: boolean;
  topics: string[];
  pushedAt: string;
  updatedAt: string;
  /** Most recent commits (newest first). Empty for repos beyond the enrichment cap. */
  recentCommits: GithubCommit[];
  lastCommit: {
    message: string;
    sha: string;
    author: string;
    at: string;
  };
  ci: {
    status: "passing" | "failing" | "running" | "none";
    workflow: string;
    at: string;
    url: string;
  };
  deployment: {
    status: "success" | "failed" | "in_progress" | "none";
    environment: string;
    at: string;
    url: string;
  };
}

export interface GithubPull {
  id: number;
  /** Short repository name. */
  repo: string;
  /** Full `owner/repo`. */
  repoFullName: string;
  url: string;
  title: string;
  author: string;
  draft: boolean;
  reviewRequested: boolean;
  checks: "passing" | "failing" | "running" | "unknown";
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: number;
  labels: string[];
  base: string;
  head: string;
  createdAt: string;
  updatedAt: string;
}

export interface GithubIssue {
  id: number;
  repo: string;
  repoFullName: string;
  url: string;
  title: string;
  author: string;
  labels: string[];
  comments: number;
  assignees: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GithubRun {
  id: number;
  repo: string;
  repoFullName: string;
  name: string;
  status: "queued" | "in_progress" | "completed" | "pending" | "waiting" | "requested";
  conclusion:
    | "success"
    | "failure"
    | "cancelled"
    | "skipped"
    | "neutral"
    | "timed_out"
    | "action_required"
    | "startup_failure"
    | "stale"
    | null;
  branch: string;
  event: string;
  actor: string;
  attempt: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface GithubRelease {
  id: number;
  repo: string;
  repoFullName: string;
  tag: string;
  name: string;
  author: string;
  prerelease: boolean;
  draft: boolean;
  url: string;
  publishedAt: string;
}

export interface GithubLanguage {
  name: string;
  count: number;
}

export interface GithubActivity {
  id: string;
  kind: "commit" | "pull" | "issue" | "release" | "action";
  repo: string;
  text: string;
  at: string;
}

export interface GithubSnapshot {
  user: {
    login: string;
    name: string;
    avatarUrl: string;
  };
  stats: {
    repos: number;
    openPulls: number;
    openIssues: number;
    commitsToday: number;
    stars: number;
    failingWorkflows: number;
    runningWorkflows: number;
    releases: number;
  };
  repos: GithubRepo[];
  pulls: GithubPull[];
  issues: GithubIssue[];
  runs: GithubRun[];
  releases: GithubRelease[];
  languages: GithubLanguage[];
  activity: GithubActivity[];
  updatedAt: string;
}
