"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, ListPlus, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";

export function QuickActions() {
  const queryClient = useQueryClient();
  const openTodoDialog = useUiStore((state) => state.openTodoDialog);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 pt-0">
        <Button
          variant="secondary"
          className="h-16 flex-col gap-1.5 text-xs"
          onClick={() => openTodoDialog()}
        >
          <ListPlus className="size-4" />
          New todo
        </Button>
        <Button
          variant="secondary"
          className="h-16 flex-col gap-1.5 text-xs"
          asChild
        >
          <Link href="/calendar">
            <CalendarPlus className="size-4" />
            Calendar
          </Link>
        </Button>
        <Button
          variant="secondary"
          className="h-16 flex-col gap-1.5 text-xs"
          onClick={() => {
            void queryClient.invalidateQueries();
          }}
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
}
