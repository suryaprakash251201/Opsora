"use client";

import {
  CircleCheck,
  CircleDot,
  CircleX,
  GitBranch,
  Star,
  GitFork,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GithubRepo } from "@/lib/types/github";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

function CiBadge({ repo }: { repo: GithubRepo }) {
  if (repo.ci.status === "none") return null;

  const meta =
    repo.ci.status === "passing"
      ? { icon: CircleCheck, variant: "success" as const, label: "CI passing" }
      : repo.ci.status === "failing"
        ? { icon: CircleX, variant: "danger" as const, label: "CI failing" }
        : { icon: CircleDot, variant: "info" as const, label: "CI running" };

  const Icon = meta.icon;

  return (
    <Badge variant={meta.variant}>
      <Icon />
      {meta.label}
    </Badge>
  );
}

function DeploymentBadge({ repo }: { repo: GithubRepo }) {
  if (repo.deployment.status === "none") return null;

  const label =
    repo.deployment.status === "success"
      ? "Deployed"
      : repo.deployment.status === "failed"
        ? "Deploy failed"
        : "Deploying";

  return (
    <Badge
      variant={
        repo.deployment.status === "success"
          ? "success"
          : repo.deployment.status === "failed"
            ? "danger"
            : "info"
      }
    >
      {label} · {repo.deployment.environment}
    </Badge>
  );
}

export function RepoCard({ repo }: { repo: GithubRepo }) {
  return (
    <article className="border-border bg-panel rounded-card flex flex-col gap-3 border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{repo.name}</h3>
          <p className="text-subtle mt-0.5 line-clamp-1 text-xs">
            {repo.description}
          </p>
        </div>
        <span className="text-subtle shrink-0 text-xs">{repo.language}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <CiBadge repo={repo} />
        <DeploymentBadge repo={repo} />
        <Badge variant="outline">
          <GitBranch />
          {repo.defaultBranch}
        </Badge>
      </div>

      <div className="border-border/60 bg-surface/40 rounded-md border px-2.5 py-2">
        <p className="truncate text-xs">{repo.lastCommit.message}</p>
        <p className="text-subtle mt-0.5 flex items-center gap-1.5 text-[11px]">
          <span className="metrics">{repo.lastCommit.sha}</span>
          <span>·</span>
          <span>{repo.lastCommit.author}</span>
          <span>·</span>
          <span>{timeAgo(repo.lastCommit.at)}</span>
        </p>
      </div>

      <div className="text-muted flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <Star className="text-subtle size-3.5" />
          {repo.stars}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="text-subtle size-3.5" />
          {repo.forks}
        </span>
        <span className={cn(repo.openIssues > 5 && "text-warning")}>
          {repo.openIssues} issues
        </span>
        <span>{repo.openPulls} PRs</span>
      </div>
    </article>
  );
}
