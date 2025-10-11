export type AnalyticsEvent =
  | { type: "row_viewed"; row: string }
  | { type: "card_clicked"; groupId: string; row?: string }
  | { type: "filter_changed"; sorts: string[]; locations: string[] }
  | { type: "search"; query: string };

export function track(event: AnalyticsEvent) {
  if (import.meta.env.MODE !== "production") {
    // eslint-disable-next-line no-console
    console.log("[analytics]", event);
  }
}


