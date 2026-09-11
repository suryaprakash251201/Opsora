"use client";

import {
  CircleAlert,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  RefreshCw,
  Star,
} from "lucide-react";
import { PageHeader } from "@/components/viz/page-header";
import {
  EmptyConfigHint,
  EmptyState,
  ErrorState,
  SectionHeader,
} from "@/components/viz/section";
import { SourceWarning } from "@/components/viz/source-warning";
import { StatTile } from "@/components/viz/stat-tile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RepoCard } from "@/features/github/repo-card";
import { IssueList, PullList } from "@/features/github/lists";
import { REFETCH_INTERVALS, useSourceSnapshot } from "@/hooks/use-snapshot";
import { LiveGithub } from "@/components/icons/live";

export default function GithubPage() {
  const { data, isLoading, isError, refetch, isFetching } = useSourceSnapshot(
    "github",
    REFETCH_INTERVALS.github,
  );

  const snapshot = data?.data;
  const isUnconfigured =
    data?.mode === "empty" && snapshot !== undefined && snapshot.repos.length === 0;

  return (
    <>
      <PageHeader
        title="GitHub"
        accent="var(--accent-github)"
        description={
          snapshot
            ? `@${snapshot.user.login || "—"} · ${snapshot.repos.length} repositories · ${snapshot.stats.openPulls} open PRs`
            : "Repositories, pull requests, issues and Actions"
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={isFetching ? "animate-spin" : undefined} />
            Refresh
          </Button>
        }
      />

      <SourceWarning snapshot={data} className="mb-4" />

      {isError ? (
        <ErrorState
          title="Could not reach GitHub"
          onRetry={() => void refetch()}
        />
      ) : isLoading || !snapshot ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-[92px]" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : isUnconfigured ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Repositories" value={0} icon={Star} />
            <StatTile label="Open PRs" value={0} icon={GitPullRequest} />
            <StatTile label="Open issues" value={0} icon={CircleAlert} />
            <StatTile label="Commits today" value={0} icon={GitCommitHorizontal} />
          </div>
          <EmptyConfigHint
            icon={LiveGithub}
            accent="var(--accent-github)"
            title="Connect a GitHub personal access token"
            description="Repos, PRs, issues, Actions runs, and review requests will appear here once Opsora can reach the GitHub API on your behalf. Use a read-only classic or fine-grained token — it stays on the server, never in the browser."
            env={["GITHUB_TOKEN"]}
          />
          <EmptyState
            icon={GitBranch}
            title="No repositories yet"
            description="Once your token has access to at least one repository, it will show up here automatically."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Repositories" value={snapshot.stats.repos} />
            <StatTile
              label="Open PRs"
              value={snapshot.stats.openPulls}
              icon={GitPullRequest}
            />
            <StatTile
              label="Open issues"
              value={snapshot.stats.openIssues}
              icon={CircleAlert}
            />
            <StatTile
              label="Commits today"
              value={snapshot.stats.commitsToday}
              icon={GitCommitHorizontal}
            />
          </div>

          {snapshot.repos.some((repo) => repo.ci.status === "failing") ? (
            <div className="border-danger/25 bg-danger/5 flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5">
              <CircleAlert className="text-danger size-4 shrink-0" />
              <p className="text-xs">
                <span className="text-danger font-medium">CI failing</span>
                <span className="text-muted">
                  {" "}
                  on{" "}
                  {snapshot.repos
                    .filter((repo) => repo.ci.status === "failing")
                    .map((repo) => repo.name)
                    .join(", ")}
                  . Check the failed workflow run.
                </span>
              </p>
            </div>
          ) : null}

          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Repositories"
              icon={Star}
              description="Most recently active first"
            />
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {[...snapshot.repos]
                .sort((a, b) => b.lastCommit.at.localeCompare(a.lastCommit.at))
                .map((repo) => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="flex flex-col gap-3">
              <SectionHeader
                title="Pull requests"
                icon={GitPullRequest}
                description={`${snapshot.pulls.length} recent`}
              />
              <PullList pulls={snapshot.pulls} />
            </section>

            <section className="flex flex-col gap-3">
              <SectionHeader
                title="Issues"
                icon={CircleAlert}
                description={`${snapshot.issues.length} recent`}
              />
              <IssueList issues={snapshot.issues} />
            </section>
          </div>
        </div>
      )}
    </>
  );
}
