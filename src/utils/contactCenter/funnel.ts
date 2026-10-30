/* Inquiry funnel percentages for the Statistics view (P6 R0). Whole percents; null where there is nothing to divide. */

export interface FunnelRow {
  key: string;
  value: number;
  ofVisits: number | null;
  drop: number | null;
}

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);

/** Each step as a share of all visits (the first step) and as the drop from the step before. */
export const funnelRows = (steps: Array<{ key: string; value: number }>): FunnelRow[] =>
  steps.map((s, i) => ({
    key: s.key,
    value: s.value,
    ofVisits: percent(s.value, steps[0].value),
    drop: i === 0 ? null : percent(steps[i - 1].value - s.value, steps[i - 1].value),
  }));

export const exitRate = (exits: number, views: number) => percent(exits, views);
