import type { Metadata } from "next";
import { PageHeader } from "@/components/viz/page-header";
import { ActivityFeed } from "@/features/home/activity-feed";
import { AttentionFeed } from "@/features/home/attention-feed";
import { InfraStrip } from "@/features/home/infra-strip";
import { QuickActions } from "@/features/home/quick-actions";
import { TodayCalendar } from "@/features/home/today-calendar";
import { TodayTodos } from "@/features/home/today-todos";

export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Home"
        description="What needs your attention right now."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <AttentionFeed />
          <InfraStrip />
          <ActivityFeed />
        </div>

        <aside className="flex flex-col gap-4">
          <TodayTodos />
          <QuickActions />
          <TodayCalendar />
        </aside>
      </div>
    </>
  );
}
