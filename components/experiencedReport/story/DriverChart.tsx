import type { DriverRow } from "@/lib/experiencedReport/types";
import viz from "../experiencedStory.module.css";
import { clampUnit, pct } from "./storyFormat";

type DriverDatum = {
  label: string;
  won: number;
  lost: number;
};

function driverData(
  wonRows: DriverRow[],
  lostRows: DriverRow[],
): DriverDatum[] {
  const byKey = new Map<string, DriverDatum>();
  for (const row of wonRows) {
    if (!row.reportable || row.share == null) continue;
    const key = row.driver.trim().toLowerCase();
    byKey.set(key, {
      label: row.driver,
      won: clampUnit(row.share),
      lost: byKey.get(key)?.lost ?? 0,
    });
  }
  for (const row of lostRows) {
    if (!row.reportable || row.share == null) continue;
    const key = row.driver.trim().toLowerCase();
    const current = byKey.get(key);
    byKey.set(key, {
      label: current?.label ?? row.driver,
      won: current?.won ?? 0,
      lost: clampUnit(row.share),
    });
  }
  return [...byKey.values()]
    .sort((a, b) => Math.max(b.won, b.lost) - Math.max(a.won, a.lost))
    .slice(0, 8);
}

export function DriverChart({ won, lost }: { won: DriverRow[]; lost: DriverRow[] }) {
  const rows = driverData(won, lost);
  const max = Math.max(0.01, ...rows.flatMap((row) => [row.won, row.lost]));
  if (!rows.length) {
    return (
      <div className={viz.emptyVisual}>
        <div>
          <strong>The reasons are still forming</strong>
          No choice reason clears the reporting requirement yet.
        </div>
      </div>
    );
  }
  return (
    <div className={viz.driverChart}>
      <div className={viz.driverLegend}>
        <span>When chosen against</span>
        <span>When chosen</span>
      </div>
      {rows.map((row) => (
        <div className={viz.driverRow} key={row.label}>
          <div className={viz.driverLabel}>{row.label}</div>
          <div className={viz.divergingTrack}>
            <div className={viz.negativeHalf}>
              {row.lost > 0 ? (
                <span
                  className={viz.negativeBar}
                  style={{ width: `${(row.lost / max) * 100}%` }}
                >
                  <span className={viz.barNumberLeft}>{pct(row.lost)}</span>
                </span>
              ) : null}
            </div>
            <div className={viz.positiveHalf}>
              {row.won > 0 ? (
                <span
                  className={viz.positiveBar}
                  style={{ width: `${(row.won / max) * 100}%` }}
                >
                  <span className={viz.barNumberRight}>{pct(row.won)}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
