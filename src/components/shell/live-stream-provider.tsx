"use client";

import { useLiveStream } from "@/hooks/use-live-stream";

export function LiveStreamProvider() {
  useLiveStream();
  return null;
}
