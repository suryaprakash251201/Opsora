import { describe, expect, it } from "vitest";
import { getServersSnapshot } from "./servers";

describe("servers snapshot", () => {
  it("averages disk usage over all disks, not a fixed divisor", () => {
    const snapshot = getServersSnapshot();
    const percents = snapshot.servers.flatMap((server) =>
      server.disks.map((disk) => (disk.usedBytes / disk.totalBytes) * 100),
    );
    const expected =
      percents.reduce((total, percent) => total + percent, 0) /
      percents.length;

    expect(percents.length).toBeGreaterThan(2);
    expect(snapshot.summary.diskAvg).toBeCloseTo(expected, 0);
  });

  it("keeps cpu and memory summaries consistent", () => {
    const snapshot = getServersSnapshot();
    const online = snapshot.servers.filter((server) => server.online);

    expect(snapshot.summary.online).toBe(online.length);
    expect(snapshot.summary.memoryTotalBytes).toBe(
      online.reduce((total, server) => total + server.memory.totalBytes, 0),
    );
  });
});
