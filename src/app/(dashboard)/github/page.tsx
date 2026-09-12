"use client";

import { useMemo, useState } from "react";
import {
  CircleAlert,
  Eye,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Pin,
  Play,
  RefreshCw,
  Rocket,
  Search,
  Star,
  Tag,
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RepoCard } from "@/features/github/repo-card";
import {
  IssueList,
  LanguageBar,
  PullList,
  ReleaseList,
  RunList,
} from "@/features/github/lists";
import { REFETCH_INTERVALS, useSourceSnapshot } from "@/hooks/use-snapshot";
import { useGithubPrefs } from "@/hooks/use-github-prefs";
import { LiveGithub } from "@/components/icons/live";
import type { GithubRepo } from "@/lib/types/github";

const ACCENT = "var(--accent-github)";
const OTHER_REPO_LIMIT = 8;

type RepoSort = "recent" | "stars" | "issues" | "name";

function sortRepos(repos: GithubRepo[], sort: RepoSort): GithubRepo[] {
  return [...repos].sort((a, b) => {
    switch (sort) {
      case "stars":
        return b.stars - a.stars || a.name.localeCompare(b.name);
      case "issues":
        return b.openIssues - a.openIssues || b.stars - a.stars;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return b.pushedAt.localeCompare(a.pushedAt);
    }
  });
}

export default function GithubPage() {
  const { data, isLoading, isError, refetch, isFetching } = useSourceSnapshot(
    "github",
    REFETCH_INTERVALS.github,
  );
  const { isPinned, isHidden, togglePin, toggleHidden } = useGithubPrefs();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<RepoSort>("recent");
  const [showAll, setShowAll] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const snapshot = data?.data;
  const isUnconfigured =
    data?.mode === "empty" && snapshot !== undefined && snapshot.repos.length === 0;

  const { pinnedRepos, otherRepos, hiddenCount } = useMemo(() => {
    const repos = snapshot?.repos ?? [];
    const needle = query.trim().toLowerCase();

    const visible = repos.filter((repo) => showHidden || !isHidden(repo.fullName));
    const filtered = needle
      ? visible.filter((repo) =>
          [repo.name, repo.fullName, repo.description, repo.language, ...repo.topics]
            .join(" ")
            .toLowerCase()
            .includes(needle),
        )
      : visible;

    const pinned = sortRepos(
      filtered.filter((repo) => isPinned(repo.fullName)),
      sort,
    );
    const others = sortRepos(
      filtered.filter((repo) => !isPinned(repo.fullName)),
      sort,
    );

    return {
      pinnedRepos: pinned,
      otherRepos: others,
      hiddenCount: repos.filter((repo) => isHidden(repo.fullName)).length,
    };
  }, [snapshot, query, sort, showHidden, isPinned, isHidden]);

  const shownOthers =
    showAll || query.trim() ? otherRepos : otherRepos.slice(0, OTHER_REPO_LIMIT);

  const reviewQueue = useMemo(
    () => (snapshot?.pulls ?? []).filter((pull) => pull.reviewRequested && !pull.draft),
    [snapshot],
  );

  const failingRepos = (snapshot?.repos ?? []).filter(
    (repo) => repo.ci.status === "failing",
  );

  return (
    <>
      <PageHeader
        title="GitHub"
        accent={ACCENT}
        description={
          snapshot
            ? `@${snapshot.user.login || "—"} · ${snapshot.stats.repos} repositories · ${snapshot.stats.openPulls} open PRs · ${snapshot.stats.runningWorkflows} workflows running`
            : "Repositories, pull requests, issues, Actions and releases"
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
            <StatTile label="Repositories" value={0} icon={Star} accent={ACCENT} />
            <StatTile label="Open PRs" value={0} icon={GitPullRequest} accent={ACCENT} />
            <StatTile label="Open issues" value={0} icon={CircleAlert} accent={ACCENT} />
            <StatTile
              label="Commits today"
              value={0}
              icon={GitCommitHorizontal}
              accent={ACCENT}
            />
          </div>
          <EmptyConfigHint
            icon={LiveGithub}
            accent={ACCENT}
            title="Connect a GitHub personal access token"
            description="Repositories, PRs, issues, Actions runs, deployments and review requests appear here once Opsora can reach the GitHub API on your behalf. Use a read-only classic or fine-grained token — it stays on the server, never in the browser."
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
            <StatTile
              label="Repositories"
              value={snapshot.stats.repos}
              icon={Star}
              accent="var(--accent-github)"
              footer={`${snapshot.stats.stars} stars · ${snapshot.languages.length} languages`}
            />
            <StatTile
              label="Open PRs"
              value={snapshot.stats.openPulls}
              icon={GitPullRequest}
              accent="var(--brand-2)"
              footer={`${reviewQueue.length} awaiting your review`}
            />
            <StatTile
              label="Your issues"
              value={snapshot.stats.openIssues}
              icon={CircleAlert}
              accent="var(--warning)"
            />
            <StatTile
              label="Commits today"
              value={snapshot.stats.commitsToday}
              icon={GitCommitHorizontal}
              accent="var(--success)"
            />
            <StatTile
              label="CI failing"
              value={snapshot.stats.failingWorkflows}
              icon={CircleAlert}
              accent={snapshot.stats.failingWorkflows > 0 ? "var(--danger)" : "var(--muted)"}
            />
            <StatTile
              label="Workflows running"
              value={snapshot.stats.runningWorkflows}
              icon={Play}
              accent="var(--info)"
            />
            <StatTile
              label="Releases"
              value={snapshot.stats.releases}
              icon={Tag}
              accent="var(--accent-todos)"
            />
            <StatTile
              label="Total Watchers"
              value={snapshot.repos.reduce((total, repo) => total + repo.watchers, 0)}
              icon={Eye}
              accent="var(--brand)"
            />
          </div>

          {failingRepos.length > 0 ? (
            <div className="border-danger/25 bg-danger/5 flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5">
              <CircleAlert className="text-danger size-4 shrink-0" />
              <p className="text-xs">
                <span className="text-danger font-medium">CI failing</span>
                <span className="text-muted">
                  {" "}
                  on {failingRepos.map((repo) => repo.name).join(", ")}. Open the
                  failed workflow run.
                </span>
              </p>
            </div>
          ) : null}

          {reviewQueue.length > 0 ? (
            <div className="border-warning/25 bg-warning/5 flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5">
              <GitPullRequest className="text-warning size-4 shrink-0" />
              <p className="text-xs">
                <span className="text-warning font-medium">
                  {reviewQueue.length} PR{reviewQueue.length > 1 ? "s" : ""} need
                  your review
                </span>
                <span className="text-muted">
                  {" "}
                  — {reviewQueue.slice(0, 3).map((pull) => `#${pull.id}`).join(", ")}
                  {reviewQueue.length > 3 ? "…" : ""}
                </span>
              </p>
            </div>
          ) : null}

          {pinnedRepos.length > 0 ? (
            <section className="flex flex-col gap-3">
              <SectionHeader
                title="Pinned"
                icon={Pin}
                description={`${pinnedRepos.length} pinned · synced to the server`}
              />
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {pinnedRepos.map((repo) => (
                  <RepoCard
                    key={repo.id}
                    repo={repo}
                    pinned
                    hidden={isHidden(repo.fullName)}
                    onTogglePin={togglePin}
                    onToggleHidden={toggleHidden}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Repositories"
              icon={Star}
              description={`${snapshot.stats.repos} total — all repositories your token can access`}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <label className="relative">
                    <Search className="text-subtle pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search repositories…"
                      className="h-8 w-56 pl-8 text-xs"
                    />
                  </label>
                  <Select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as RepoSort)}
                    className="h-8 w-36 text-xs"
                    aria-label="Sort repositories"
                  >
                    <option value="recent">Recently pushed</option>
                    <option value="stars">Most stars</option>
                    <option value="issues">Most issues</option>
                    <option value="name">Name</option>
                  </Select>
                </div>
              }
            />

            {otherRepos.length === 0 && pinnedRepos.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No repositories match"
                description="Try a different search term or clear the filter."
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {shownOthers.map((repo) => (
                    <RepoCard
                      key={repo.id}
                      repo={repo}
                      pinned={false}
                      hidden={isHidden(repo.fullName)}
                      onTogglePin={togglePin}
                      onToggleHidden={toggleHidden}
                    />
                  ))}
                </div>
                {!showAll && !query.trim() && otherRepos.length > OTHER_REPO_LIMIT ? (
                  <div className="flex justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowAll(true)}
                    >
                      Show all {otherRepos.length} repositories
                    </Button>
                  </div>
                ) : null}
              </>
            )}

            {hiddenCount > 0 ? (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHidden((value) => !value)}
                >
                  {showHidden
                    ? `Hide ${hiddenCount} hidden repositories`
                    : `Show ${hiddenCount} hidden repositories`}
                </Button>
              </div>
            ) : null}
          </section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="flex flex-col gap-3">
              <SectionHeader
                title="Pull requests"
                icon={GitPullRequest}
                description={`${snapshot.pulls.length} open · grouped by recency`}
              />
              <PullList pulls={snapshot.pulls} />
            </section>

            <section className="flex flex-col gap-3">
              <SectionHeader
                title="Issues involving you"
                icon={CircleAlert}
                description={`${snapshot.issues.length} open · authored, assigned or mentioned`}
              />
              <IssueList issues={snapshot.issues} />
            </section>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="flex flex-col gap-3">
              <SectionHeader
                title="CI / CD activity"
                icon={Play}
                description="Latest workflow runs across your repositories"
              />
              <RunList runs={snapshot.runs} />
            </section>

            <section className="flex flex-col gap-3">
              <SectionHeader
                title="Recent releases"
                icon={Tag}
                description={`${snapshot.releases.length} latest`}
              />
              <ReleaseList releases={snapshot.releases} />
            </section>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="flex flex-col gap-3">
              <SectionHeader
                title="Language breakdown"
                icon={GitBranch}
                description="Repositories per primary language"
              />
              <LanguageBar languages={snapshot.languages} />
            </section>

            <section className="flex flex-col gap-3">
              <SectionHeader
                title="Deployments"
                icon={Rocket}
                description="Latest deployment per repository"
              />
              {snapshot.repos.filter(
                (repo) => repo.deployment.status !== "none",
              ).length === 0 ? (
                <p className="text-subtle py-6 text-center text-xs">
                  No deployments recorded.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {snapshot.repos
                    .filter((repo) => repo.deployment.status !== "none")
                    .slice(0, 6)
                    .map((repo) => (
                      <li
                        key={repo.id}
                        className="border-border/60 bg-surface/30 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-xs"
                      >
                        <span className="truncate">{repo.fullName}</span>
                        <span className="text-subtle metrics shrink-0">
                          {repo.deployment.environment} ·{" "}
                          {repo.deployment.status}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
