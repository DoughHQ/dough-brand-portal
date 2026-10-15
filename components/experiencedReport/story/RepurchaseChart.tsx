import type { CSSProperties } from "react";
import story from "@/components/reportStory/reportStory.module.css";
import type { RepurchaseSessionMetric } from "@/lib/experiencedReport/types";
import viz from "../experiencedStory.module.css";
import { clampUnit, pct } from "./storyFormat";

export type SessionMetrics = {
  session: number;
  definite: number | null;
  topTwo: number | null;
  no: number | null;
};

export function repurchaseSessions(rows: RepurchaseSessionMetric[]): SessionMetrics[] {
  const sessions = new Map<number, SessionMetrics>();
  for (const row of rows) {
    if (!row.reportable || row.rate == null) continue;
    const current = sessions.get(row.session_number) ?? {
      session: row.session_number,
      definite: null,
      topTwo: null,
      no: null,
    };
    const rate = clampUnit(row.rate);
    if (row.metric === "definite_yes") current.definite = rate;
    if (row.metric === "top_two_box") current.topTwo = rate;
    if (row.metric === "no") current.no = rate;
    sessions.set(row.session_number, current);
  }
  return [...sessions.values()].sort((a, b) => a.session - b.session);
}

export function RepurchaseChart({ rows }: { rows: RepurchaseSessionMetric[] }) {
  const sessions = repurchaseSessions(rows);
  if (!sessions.length) {
    return (
      <div className={viz.emptyVisual}>
        <div>
          <strong>No buy-again signal is reportable yet</strong>
          The chart appears when the response base clears its floor.
        </div>
      </div>
    );
  }

  const primary = sessions[0];
  const definite = primary.definite;
  const maybe = primary.topTwo;
  const no = primary.no;
  const multi = sessions.length > 1;

  return (
    <div className={viz.intentFigure}>
      <div className={viz.intentHero}>
        <div
          className={viz.intentHeroValue}
          aria-label={
            definite == null
              ? "Definite buy-again not reportable"
              : `${pct(definite)} would definitely buy again`
          }
        >
          {definite == null ? "—" : pct(definite)}
        </div>
        <div className={viz.intentHeroCopy}>
          <strong>Definitely would buy again</strong>
          <span>
            Session {primary.session}
            {multi ? " · first reportable session" : ""}
          </span>
        </div>
      </div>

      <div className={viz.intentTracks} role="img" aria-label="Buy-again intent composition">
        {definite != null ? (
          <div className={viz.intentTrackRow}>
            <div className={viz.intentTrackMeta}>
              <span>Definitely yes</span>
              <strong>{pct(definite)}</strong>
            </div>
            <div className={viz.intentTrack}>
              <span
                className={viz.intentFillDefinite}
                style={{ width: `${definite * 100}%` } as CSSProperties}
              />
            </div>
          </div>
        ) : null}

        {maybe != null ? (
          <div className={viz.intentTrackRow}>
            <div className={viz.intentTrackMeta}>
              <span>At least maybe</span>
              <strong>{pct(maybe)}</strong>
            </div>
            <div className={viz.intentTrack}>
              <span
                className={viz.intentFillMaybe}
                style={{ width: `${maybe * 100}%` } as CSSProperties}
              />
              {definite != null ? (
                <span
                  className={viz.intentNestedDefinite}
                  style={{ width: `${definite * 100}%` } as CSSProperties}
                  title={`Definitely yes · ${pct(definite)} is inside this band`}
                />
              ) : null}
            </div>
            <p className={viz.intentNestedNote}>
              Includes “definitely yes” — not a separate group.
            </p>
          </div>
        ) : null}

        {no != null ? (
          <div className={`${viz.intentTrackRow} ${viz.intentReject}`}>
            <div className={viz.intentTrackMeta}>
              <span>No</span>
              <strong>{pct(no)}</strong>
            </div>
            <div className={viz.intentTrack}>
              <span
                className={viz.intentFillNo}
                style={{ width: `${no * 100}%` } as CSSProperties}
              />
            </div>
          </div>
        ) : null}
      </div>

      {multi ? (
        <div className={viz.intentSessionStrip}>
          <p className={viz.intentSessionLabel}>Definite yes by session</p>
          <div className={viz.intentSessionRows}>
            {sessions.map((session) => (
              <div className={viz.intentSessionRow} key={session.session}>
                <span>S{session.session}</span>
                <div className={viz.intentTrack}>
                  {session.definite != null ? (
                    <span
                      className={viz.intentFillDefinite}
                      style={
                        {
                          width: `${session.definite * 100}%`,
                        } as CSSProperties
                      }
                    />
                  ) : null}
                </div>
                <strong>
                  {session.definite == null ? "—" : pct(session.definite)}
                </strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className={story.finePrint}>
        Stated intent after use — not observed repeat purchase. Rates are shares
        of the session base, not independent votes that sum to 100%.
      </p>
    </div>
  );
}
