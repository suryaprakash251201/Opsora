"use client";

import { GitPullRequest, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GithubIssue, GithubPull } from "@/lib/types/github";
import { timeAgo } from "@/lib/format";

const checkVariant = {
  passing: "success",
  failing: "danger",
  running: "info",
} as const;

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
          key={`${pull.repo}-${pull.id}`}
          className="border-border/60 bg-surface/30 hover:border-border-strong flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors"
        >
          <GitPullRequest className="text-subtle mt-0.5 size-3.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px]">
              #{pull.id} {pull.title}
            </p>
            <p className="text-subtle mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span>{pull.repo}</span>
              <span>·</span>
              <span>{pull.author}</span>
              <span>·</span>
              <span>{timeAgo(pull.createdAt)}</span>
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant="success">+{pull.additions}</Badge>
              <Badge variant="danger">−{pull.deletions}</Badge>
              <Badge variant={checkVariant[pull.checks]}>checks {pull.checks}</Badge>
              {pull.reviewRequested ? (
                <Badge variant="warning">review requested</Badge>
              ) : null}
              {pull.draft ? <Badge variant="outline">draft</Badge> : null}
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
          key={`${issue.repo}-${issue.id}`}
          className="border-border/60 bg-surface/30 hover:border-border-strong flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors"
        >
          <MessageSquare className="text-subtle mt-0.5 size-3.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px]">
              #{issue.id} {issue.title}
            </p>
            <p className="text-subtle mt-0.5 text-[11px]">
              {issue.repo} · {issue.author} · {timeAgo(issue.createdAt)}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
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
