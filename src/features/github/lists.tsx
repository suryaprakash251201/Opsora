"use client";

import {
  CircleCheck,
  CircleDot,
  CircleSlash,
  CircleX,
  ExternalLink,
  GitPullRequest,
  MessageSquare,
  Play,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  GithubIssue,
  GithubLanguage,
  GithubPull,
  GithubRelease,
  GithubRun,
} from "@/lib/types/github";
import { formatNumber, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const checkVariant = {
  passing: "success",
  failing: "danger",
  running: "info",
  unknown: "outline",
} as const;

function ExternalLinkIcon() {
  return <ExternalLink className="size-3 opacity-60" />;
}

export function PullList({ pulls }: { pulls: GithubPull[] }) {
  if (pulls.length === 0) {
    return (
      <p className="text-subtle py-6 text-center text-xs">
        No open pull requests.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {pulls.map((pull) => (
        <li
          key={`${pull.repoFullName}-${pull.id}`}
          className={cn(
            "border-border/60 bg-surface/30 hover:border-border-strong flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
            pull.reviewRequested && "border-warning/30",
          )}
        >
          <GitPullRequest className="text-subtle mt-0.5 size-3.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <a
              href={pull.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-info flex items-center gap-1 text-[13px] underline-offset-4 hover:underline"
            >
              <span className="truncate">
                #{pull.id} {pull.title}
              </span>
              <ExternalLinkIcon />
            </a>
            <p className="text-subtle mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-foreground/70">{pull.repoFullName}</span>
              <span>·</span>
              <span>{pull.author}</span>
              <span>·</span>
              <span>{timeAgo(pull.updatedAt)}</span>
              <span>·</span>
              <span>
                {pull.head} → {pull.base}
              </span>
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {pull.additions > 0 || pull.deletions > 0 ? (
                <>
                  <Badge variant="success">+{pull.additions}</Badge>
                  <Badge variant="danger">−{pull.deletions}</Badge>
                </>
              ) : null}
              {pull.checks !== "unknown" ? (
                <Badge variant={checkVariant[pull.checks]}>
                  checks {pull.checks}
                </Badge>
              ) : null}
              <Badge variant="outline">
                <MessageSquare />
                {pull.comments}
              </Badge>
              {pull.reviewRequested ? (
                <Badge variant="warning">review requested</Badge>
              ) : null}
              {pull.draft ? <Badge variant="outline">draft</Badge> : null}
              {pull.labels.slice(0, 3).map((label) => (
                <Badge key={label} variant="outline">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function IssueList({ issues }: { issues: GithubIssue[] }) {
  if (issues.length === 0) {
    return (
      <p className="text-subtle py-6 text-center text-xs">No open issues.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {issues.map((issue) => (
        <li
          key={`${issue.repoFullName}-${issue.id}`}
          className="border-border/60 bg-surface/30 hover:border-border-strong flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors"
        >
          <MessageSquare className="text-subtle mt-0.5 size-3.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <a
              href={issue.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-info flex items-center gap-1 text-[13px] underline-offset-4 hover:underline"
            >
              <span className="truncate">
                #{issue.id} {issue.title}
              </span>
              <ExternalLinkIcon />
            </a>
            <p className="text-subtle mt-0.5 text-[11px]">
              {issue.repoFullName} · {issue.author} · {timeAgo(issue.updatedAt)} ·{" "}
              {issue.comments} comments
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {issue.assignees.slice(0, 2).map((assignee) => (
                <Badge key={assignee} variant="info">
                  @{assignee}
                </Badge>
              ))}
              {issue.labels.map((label) => (
                <Badge key={label} variant="outline">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function runMeta(run: GithubRun) {
  if (run.status !== "completed") {
    return { icon: CircleDot, variant: "info" as const, label: run.status.replace("_", " ") };
  }
  switch (run.conclusion) {
    case "success":
      return { icon: CircleCheck, variant: "success" as const, label: "success" };
    case "failure":
    case "timed_out":
    case "startup_failure":
    case "action_required":
      return { icon: CircleX, variant: "danger" as const, label: run.conclusion.replace("_", " ") };
    case "cancelled":
    case "skipped":
    case "stale":
      return { icon: CircleSlash, variant: "outline" as const, label: run.conclusion };
    default:
      return { icon: CircleDot, variant: "outline" as const, label: "neutral" };
  }
}

export function RunList({ runs }: { runs: GithubRun[] }) {
  if (runs.length === 0) {
    return (
      <p className="text-subtle py-6 text-center text-xs">
        No workflow runs yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {runs.map((run) => {
        const meta = runMeta(run);
        const Icon = meta.icon;

        return (
          <li
            key={`${run.repoFullName}-${run.id}`}
            className="border-border/60 bg-surface/30 hover:border-border-strong flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors"
          >
            <Play className="text-subtle mt-0.5 size-3.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <a
                href={run.url || `https://github.com/${run.repoFullName}/actions`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-info flex items-center gap-1 text-[13px] underline-offset-4 hover:underline"
              >
                <span className="truncate">{run.name}</span>
                <ExternalLinkIcon />
              </a>
              <p className="text-subtle mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-foreground/70">{run.repoFullName}</span>
                <span>·</span>
                <span>{run.branch || run.event || "workflow"}</span>
                <span>·</span>
                <span>{run.event}</span>
                {run.actor ? (
                  <>
                    <span>·</span>
                    <span>@{run.actor}</span>
                  </>
                ) : null}
                <span>·</span>
                <span>{timeAgo(run.updatedAt)}</span>
              </p>
            </div>
            <Badge variant={meta.variant} className="mt-0.5 shrink-0">
              <Icon />
              {meta.label}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

export function ReleaseList({ releases }: { releases: GithubRelease[] }) {
  if (releases.length === 0) {
    return (
      <p className="text-subtle py-6 text-center text-xs">
        No published releases.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {releases.map((release) => (
        <li
          key={`${release.repoFullName}-${release.id}`}
          className="border-border/60 bg-surface/30 hover:border-border-strong flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors"
        >
          <Tag className="text-subtle mt-0.5 size-3.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <a
              href={release.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-info flex items-center gap-1 text-[13px] underline-offset-4 hover:underline"
            >
              <span className="truncate">
                {release.name}
                <span className="text-subtle metrics ml-1.5 text-[11px]">
                  {release.tag}
                </span>
              </span>
              <ExternalLinkIcon />
            </a>
            <p className="text-subtle mt-0.5 text-[11px]">
              {release.repoFullName} · {release.author} · {timeAgo(release.publishedAt)}
            </p>
          </div>
          {release.prerelease ? (
            <Badge variant="warning" className="mt-0.5 shrink-0">
              pre-release
            </Badge>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

const LANGUAGE_COLORS = [
  "var(--info)",
  "var(--success)",
  "var(--warning)",
  "var(--brand)",
  "var(--accent-github)",
  "var(--accent-pihole)",
  "var(--accent-docker)",
  "var(--accent-servers)",
];

export function LanguageBar({ languages }: { languages: GithubLanguage[] }) {
  if (languages.length === 0) {
    return (
      <p className="text-subtle py-6 text-center text-xs">
        No language data yet.
      </p>
    );
  }

  const total = languages.reduce((sum, language) => sum + language.count, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-surface flex h-2 overflow-hidden rounded-full">
        {languages.map((language, index) => (
          <span
            key={language.name}
            title={`${language.name} · ${language.count}`}
            style={{
              width: `${(language.count / total) * 100}%`,
              background: LANGUAGE_COLORS[index % LANGUAGE_COLORS.length],
            }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {languages.map((language, index) => (
          <li
            key={language.name}
            className="text-muted flex items-center gap-1.5 text-[11px]"
          >
            <span
              className="size-2 rounded-full"
              style={{
                background: LANGUAGE_COLORS[index % LANGUAGE_COLORS.length],
              }}
            />
            {language.name}
            <span className="text-subtle">
              {formatNumber(language.count)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
