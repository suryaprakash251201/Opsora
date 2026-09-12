"use client";

import {
  Archive,
  CircleCheck,
  CircleDot,
  CircleX,
  ExternalLink,
  Eye,
  EyeOff,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  GitPullRequest,
  Lock,
  Pin,
  PinOff,
  Rocket,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const badge = (
    <Badge variant={meta.variant}>
      <Icon />
      {meta.label}
    </Badge>
  );

  return repo.ci.url ? (
    <a
      href={repo.ci.url}
      target="_blank"
      rel="noreferrer"
      title={`${repo.ci.workflow} · ${timeAgo(repo.ci.at)}`}
    >
      {badge}
    </a>
  ) : (
    badge
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

  const badge = (
    <Badge
      variant={
        repo.deployment.status === "success"
          ? "success"
          : repo.deployment.status === "failed"
            ? "danger"
            : "info"
      }
    >
      <Rocket />
      {label} · {repo.deployment.environment}
    </Badge>
  );

  return repo.deployment.url ? (
    <a href={repo.deployment.url} target="_blank" rel="noreferrer">
      {badge}
    </a>
  ) : (
    badge
  );
}

interface RepoCardProps {
  repo: GithubRepo;
  pinned: boolean;
  hidden?: boolean;
  onTogglePin: (fullName: string) => void;
  onToggleHidden: (fullName: string) => void;
}

export function RepoCard({
  repo,
  pinned,
  hidden = false,
  onTogglePin,
  onToggleHidden,
}: RepoCardProps) {
  const commits = repo.recentCommits;

  return (
    <article
      className={cn(
        "card-elevated group/repo relative flex flex-col justify-between gap-3.5 rounded-2xl border border-border/80 p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong",
        pinned && "border-[var(--accent-github)]/40 shadow-xs",
      )}
    >
      {pinned ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
          style={{
            background: "var(--accent-github)",
            boxShadow: "0 1px 8px var(--accent-github)",
          }}
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 truncate text-[14px] font-bold text-foreground tracking-tight">
            <a
              href={repo.url || `https://github.com/${repo.fullName}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand inline-flex min-w-0 items-center gap-1.5 truncate underline-offset-4 hover:underline"
            >
              <span className="truncate">{repo.name}</span>
              <ExternalLink className="size-3 shrink-0 opacity-50 transition-opacity group-hover/repo:opacity-100" />
            </a>
            {repo.isPrivate ? (
              <span title="Private repository" className="flex size-4 items-center justify-center rounded bg-surface text-subtle">
                <Lock className="size-2.5" />
              </span>
            ) : null}
            {repo.archived ? (
              <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                <Archive className="size-2.5" />
                archived
              </Badge>
            ) : null}
          </h3>
          {repo.description ? (
            <p className="text-muted mt-1 line-clamp-2 text-xs leading-relaxed">
              {repo.description}
            </p>
          ) : (
            <p className="text-subtle mt-1 italic text-xs">No description provided</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {repo.language ? (
            <span className="text-subtle border border-border/60 bg-surface/50 rounded-full px-2 py-0.5 text-[10.5px] font-medium">
              {repo.language}
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={pinned ? "Unpin repository" : "Pin repository"}
            title={pinned ? "Unpin repository" : "Pin repository"}
            onClick={() => onTogglePin(repo.fullName)}
            className="hover:bg-surface"
          >
            {pinned ? (
              <Pin className="text-[var(--accent-github)] size-3.5 fill-current" />
            ) : (
              <PinOff className="text-subtle size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={hidden ? "Unhide repository" : "Hide repository"}
            title={hidden ? "Unhide repository" : "Hide repository"}
            onClick={() => onToggleHidden(repo.fullName)}
            className="hover:bg-surface"
          >
            {hidden ? (
              <Eye className="text-subtle size-3.5" />
            ) : (
              <EyeOff className="text-subtle size-3.5" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <CiBadge repo={repo} />
        <DeploymentBadge repo={repo} />
        <Badge variant="outline" className="gap-1 font-mono text-[10.5px]">
          <GitBranch className="size-3 text-subtle" />
          {repo.defaultBranch}
        </Badge>
        {repo.openPulls > 0 ? (
          <Badge variant="info" className="gap-1 font-semibold text-[10.5px]">
            <GitPullRequest className="size-3" />
            {repo.openPulls} open
          </Badge>
        ) : null}
      </div>

      <div className="rounded-xl border border-border/70 bg-surface/40 p-2.5">
        <p className="truncate text-xs font-medium text-foreground">{repo.lastCommit.message}</p>
        <p className="text-subtle mt-1 flex items-center gap-1.5 text-[10.5px]">
          <GitCommitHorizontal className="size-3" />
          <span className="metrics font-semibold text-foreground/80">{repo.lastCommit.sha}</span>
          <span>·</span>
          <span className="truncate">{repo.lastCommit.author}</span>
          <span>·</span>
          <span className="shrink-0">{timeAgo(repo.lastCommit.at)}</span>
        </p>
      </div>

      {commits.length > 1 ? (
        <ul className="flex flex-col gap-1 border-t border-border/50 pt-2">
          {commits.slice(1, 3).map((commit) => (
            <li
              key={commit.sha}
              className="text-subtle flex items-center gap-2 text-[11px]"
            >
              <span className="metrics text-foreground/70 shrink-0 font-mono text-[10px]">
                {commit.sha}
              </span>
              <span className="truncate">{commit.message}</span>
              <span className="ml-auto shrink-0 text-[10px] text-subtle">{timeAgo(commit.at)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="text-subtle mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium border-t border-border/60 pt-2.5">
        <span className="flex items-center gap-1">
          <Star className="size-3.5 text-warning fill-warning/20" />
          <span className="metrics font-bold text-foreground">{repo.stars}</span>
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="size-3.5 text-subtle" />
          <span className="metrics">{repo.forks}</span>
        </span>
        <span className="flex items-center gap-1">
          <Eye className="size-3.5 text-subtle" />
          <span className="metrics">{repo.watchers}</span>
        </span>
        <span className={cn(repo.openIssues > 5 ? "text-warning font-semibold" : "text-subtle")}>
          <span className="metrics">{repo.openIssues}</span> issues
        </span>
        <span className="metrics">{repo.openPulls} PRs</span>
      </div>

      {repo.topics.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {repo.topics.slice(0, 4).map((topic) => (
            <span
              key={topic}
              className="border border-border/60 bg-surface/50 text-subtle rounded-md px-1.5 py-0.2 text-[9.5px] font-mono"
            >
              #{topic}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
