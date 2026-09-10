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
