import type { Metadata } from "next";
import { Hero } from "@/components/viz/hero";
import { ActivityFeed } from "@/features/home/activity-feed";
import { AttentionFeed } from "@/features/home/attention-feed";
import { InfraStrip } from "@/features/home/infra-strip";
import { QuickActions } from "@/features/home/quick-actions";
import { SourceWarnings } from "@/features/home/source-warnings";
import { TodayCalendar } from "@/features/home/today-calendar";
import { TodayTodos } from "@/features/home/today-todos";
import { ScrollRevealMount } from "@/components/viz/scroll-reveal-mount";

export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage() {
  return (
    <>
      {/* Wires the IntersectionObserver for `.reveal` elements. Client-only. */}
      <ScrollRevealMount />

      <Hero />

      <div className="reveal" data-delay="2">
        <SourceWarnings />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <div className="reveal" data-delay="2">
            <AttentionFeed />
          </div>
          <div className="reveal" data-delay="3">
            <InfraStrip />
          </div>
          <div className="reveal" data-delay="4">
            <ActivityFeed />
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="reveal" data-delay="2">
            <TodayTodos />
          </div>
          <div className="reveal" data-delay="3">
            <QuickActions />
          </div>
          <div className="reveal" data-delay="4">
            <TodayCalendar />
          </div>
        </aside>
      </div>
    </>
  );
}