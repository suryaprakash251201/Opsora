import type { Metadata } from "next";
import { Hero } from "@/components/viz/hero";
import { ActivityFeed } from "@/features/home/activity-feed";
import { AttentionFeed } from "@/features/home/attention-feed";
import { InfraStrip } from "@/features/home/infra-strip";
import { QuickActions } from "@/features/home/quick-actions";
import { SourceWarnings } from "@/features/home/source-warnings";
import { TodayCalendar } from "@/features/home/today-calendar";
import { TodayTodos } from "@/features/home/today-todos";

export const metadata: Metadata = {
  title: "Home",
};

/**
 * Home dashboard — critical blocks (source warnings, attention feed) render
 * directly with no scroll-reveal gating, so a JS or observer failure can
 * never hide them. Each feature owns its own loading skeleton.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <SourceWarnings />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <AttentionFeed />
          <InfraStrip />
          <ActivityFeed />
        </div>

        <aside className="flex flex-col gap-4" aria-label="Today">
          <TodayTodos />
          <QuickActions />
          <TodayCalendar />
        </aside>
      </div>
    </>
  );
}
