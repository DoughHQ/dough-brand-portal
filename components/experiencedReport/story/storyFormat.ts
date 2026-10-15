import { asUnit } from "@/lib/experiencedReport/executiveSummary";
import type { ExperiencedReportEnvelope } from "@/lib/experiencedReport/types";

export function pct(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(asUnit(value) * 100).toFixed(digits)}%`;
}

export function numberValue(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

export function clampUnit(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, asUnit(value)));
}

export function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function displayLabel(value: string): string {
  const label = value.replace(/_/g, " ").trim();
  return label ? `${label[0].toUpperCase()}${label.slice(1)}` : "Evidence";
}

export function movementTitle(envelope: ExperiencedReportEnvelope): string {
  const lift = envelope.report.experience_lift_vs_baseline;
  if (!lift?.reportable || lift.mean_elo_delta == null) {
    return "Preference movement is not reportable yet.";
  }
  if (lift.mean_elo_delta > 0) {
    return `Preference moved upward by ${numberValue(lift.mean_elo_delta)} Elo points on average.`;
  }
  if (lift.mean_elo_delta < 0) {
    return `Preference moved downward by ${numberValue(Math.abs(lift.mean_elo_delta))} Elo points on average.`;
  }
  return "Average preference position did not move.";
}
