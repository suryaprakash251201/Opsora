import { hoursAgo, minutesAgo, oscillate } from "@/lib/mock/random";

export interface GithubRepo {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  openPulls: number;
  defaultBranch: string;
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
  };
  deployment: {
    status: "success" | "failed" | "in_progress" | "none";
    environment: string;
    at: string;
  };
}

export interface GithubPull {
  id: number;
  repo: string;
  title: string;
  author: string;
  draft: boolean;
  reviewRequested: boolean;
  checks: "passing" | "failing" | "running";
  additions: number;
  deletions: number;
  createdAt: string;
}

export interface GithubIssue {
  id: number;
  repo: string;
  title: string;
  author: string;
  labels: string[];
  comments: number;
  createdAt: string;
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
  };
  stats: {
    repos: number;
    openPulls: number;
    openIssues: number;
    commitsToday: number;
  };
  repos: GithubRepo[];
  pulls: GithubPull[];
  issues: GithubIssue[];
  activity: GithubActivity[];
  updatedAt: string;
}

export function getGithubSnapshot(): GithubSnapshot {
  const now = Date.now();

  const repos: GithubRepo[] = [
    {
      id: "cloud-dock",
      name: "cloud-dock",
      description: "Self-hosted file sync and snapshot service",
      language: "TypeScript",
      stars: 128,
      forks: 14,
      openIssues: 3,
      openPulls: 2,
      defaultBranch: "main",
      lastCommit: {
        message: "feat(storage): add R2 multipart upload support",
        sha: "a3f91c2",
        author: "surya",
        at: minutesAgo(2, now),
      },
      ci: {
        status: "failing",
        workflow: "ci.yml · test",
        at: minutesAgo(38, now),
      },
      deployment: {
        status: "success",
        environment: "production",
        at: hoursAgo(3.4, now),
      },
    },
    {
      id: "opsora",
      name: "opsora",
      description: "Personal command center for life and infrastructure",
      language: "TypeScript",
      stars: 12,
      forks: 2,
      openIssues: 1,
      openPulls: 1,
      defaultBranch: "main",
      lastCommit: {
        message: "feat(home): attention feed scoring rules",
        sha: "7c2e04b",
        author: "surya",
        at: minutesAgo(74, now),
      },
      ci: {
        status: "passing",
        workflow: "ci.yml · lint-test",
        at: minutesAgo(66, now),
      },
      deployment: {
        status: "none",
        environment: "-",
        at: hoursAgo(20, now),
      },
    },
    {
      id: "backend-api",
      name: "backend-api",
      description: "Internal API for mobile and web clients",
      language: "Go",
      stars: 34,
      forks: 6,
      openIssues: 8,
      openPulls: 3,
      defaultBranch: "develop",
      lastCommit: {
        message: "refactor(auth): rotate refresh tokens on reuse",
        sha: "e81d774",
        author: "aditya",
        at: hoursAgo(5.1, now),
      },
      ci: {
        status: "running",
        workflow: "build.yml · integration",
        at: minutesAgo(9, now),
      },
      deployment: {
        status: "in_progress",
        environment: "staging",
        at: minutesAgo(12, now),
      },
    },
    {
      id: "dotfiles",
      name: "dotfiles",
      description: "Nix, nvim, and shell configuration",
      language: "Lua",
      stars: 6,
      forks: 1,
      openIssues: 1,
      openPulls: 0,
      defaultBranch: "main",
      lastCommit: {
        message: "chore(nvim): swap telescope for fzf-lua",
        sha: "b41aa90",
        author: "surya",
        at: hoursAgo(26, now),
      },
      ci: {
        status: "passing",
        workflow: "check.yml",
        at: hoursAgo(26, now),
      },
      deployment: {
        status: "none",
        environment: "-",
        at: hoursAgo(26, now),
      },
    },
  ];

  const pulls: GithubPull[] = [
    {
      id: 42,
      repo: "cloud-dock",
      title: "Add R2 storage backend for snapshots",
      author: "aditya",
      draft: false,
      reviewRequested: true,
      checks: "passing",
      additions: 486,
      deletions: 92,
      createdAt: hoursAgo(6, now),
    },
    {
      id: 51,
      repo: "backend-api",
      title: "Rate limit the refresh token endpoint",
      author: "surya",
      draft: false,
      reviewRequested: false,
      checks: "failing",
      additions: 132,
      deletions: 24,
      createdAt: hoursAgo(11, now),
    },
    {
      id: 48,
      repo: "cloud-dock",
      title: "Bump caddy to v2.10",
      author: "renovate",
      draft: false,
      reviewRequested: false,
      checks: "passing",
      additions: 8,
      deletions: 8,
      createdAt: hoursAgo(2.5, now),
    },
    {
      id: 7,
      repo: "opsora",
      title: "Attention engine v0.1",
      author: "surya",
      draft: true,
      reviewRequested: false,
      checks: "passing",
      additions: 912,
      deletions: 40,
      createdAt: hoursAgo(30, now),
    },
  ];

  const issues: GithubIssue[] = [
    {
      id: 63,
      repo: "cloud-dock",
      title: "Snapshot upload fails on files larger than 4 GB",
      author: "aditya",
      labels: ["bug", "priority: high"],
      comments: 4,
      createdAt: hoursAgo(20, now),
    },
    {
      id: 118,
      repo: "backend-api",
      title: "Add structured logging for the request pipeline",
      author: "surya",
      labels: ["enhancement"],
      comments: 1,
      createdAt: hoursAgo(52, now),
    },
    {
      id: 4,
      repo: "opsora",
      title: "Light mode for the dashboard",
      author: "surya",
      labels: ["design", "later"],
      comments: 0,
      createdAt: hoursAgo(70, now),
    },
    {
      id: 12,
      repo: "dotfiles",
      title: "Nvim config for Rust with rust-analyzer",
      author: "surya",
      labels: ["enhancement"],
      comments: 0,
      createdAt: hoursAgo(140, now),
    },
  ];

  const activity: GithubActivity[] = [
    {
      id: "act-1",
      kind: "commit",
      repo: "cloud-dock",
      text: "a3f91c2 feat(storage): add R2 multipart upload support",
      at: minutesAgo(2, now),
    },
    {
      id: "act-2",
      kind: "action",
      repo: "cloud-dock",
      text: "CI failed on main · test",
      at: minutesAgo(38, now),
    },
    {
      id: "act-3",
      kind: "pull",
      repo: "cloud-dock",
      text: "#48 Bump caddy to v2.10 opened by renovate",
      at: hoursAgo(2.5, now),
    },
    {
      id: "act-4",
      kind: "release",
      repo: "backend-api",
      text: "v0.9.0 released · staging",
      at: hoursAgo(4.2, now),
    },
    {
      id: "act-5",
      kind: "commit",
      repo: "backend-api",
      text: "e81d774 refactor(auth): rotate refresh tokens on reuse",
      at: hoursAgo(5.1, now),
    },
    {
      id: "act-6",
      kind: "issue",
      repo: "cloud-dock",
      text: "#63 Snapshot upload fails on files larger than 4 GB",
      at: hoursAgo(20, now),
    },
    {
      id: "act-7",
      kind: "commit",
      repo: "dotfiles",
      text: "b41aa90 chore(nvim): swap telescope for fzf-lua",
      at: hoursAgo(26, now),
    },
  ];

  return {
    user: {
      login: "suryaprakash",
      name: "Suryaprakash",
    },
    stats: {
      repos: repos.length,
      openPulls: pulls.filter((pull) => !pull.draft).length,
      openIssues: issues.length,
      commitsToday: Math.round(oscillate(7, 2, 3_600_000, 1.4, now)),
    },
    repos,
    pulls,
    issues,
    activity,
    updatedAt: new Date(now).toISOString(),
  };
}
