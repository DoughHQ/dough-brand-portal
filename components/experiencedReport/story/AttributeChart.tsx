import type { AttributeImportance } from "@/lib/experiencedReport/types";
import viz from "../experiencedStory.module.css";

export function AttributeChart({ data }: { data: AttributeImportance | null }) {
  const rows = (data?.attributes ?? [])
    .filter((row) => row.reportable && row.bw_score != null)
    .sort((a, b) => Math.abs(b.bw_score ?? 0) - Math.abs(a.bw_score ?? 0))
    .slice(0, 8);
  const max = Math.max(0.01, ...rows.map((row) => Math.abs(row.bw_score ?? 0)));

  if (!rows.length) {
    return (
      <div className={viz.emptyVisual}>
        <div>
          <strong>No attribute priority is reportable yet</strong>
          This report will not infer category priorities from isolated comments.
        </div>
      </div>
    );
  }

  return (
    <div className={viz.attributeChart}>
      {rows.map((row) => {
        const score = row.bw_score ?? 0;
        const width = (Math.abs(score) / max) * 100;
        return (
          <div className={viz.attributeRow} key={row.attribute}>
            <div className={viz.attributeName}>{row.attribute}</div>
            <div className={viz.attributeTrack}>
              <div className={viz.attributeNegative}>
                {score < 0 ? (
                  <span
                    className={viz.attributeFillNegative}
                    style={{ width: `${width}%` }}
                  />
                ) : null}
              </div>
              <div className={viz.attributePositive}>
                {score > 0 ? (
                  <span
                    className={viz.attributeFillPositive}
                    style={{ width: `${width}%` }}
                  />
                ) : null}
              </div>
            </div>
            <div className={viz.attributeValue}>
              {score > 0 ? "+" : ""}
              {score.toFixed(2)}
            </div>
          </div>
        );
      })}
      <div className={viz.attributeAxis} aria-hidden="true">
        <span>More objectionable</span>
        <span>More compelling</span>
      </div>
    </div>
  );
}
