export const statusTone = (s: string) =>
  (({ CONFIRMED: "green", REQUESTED: "blue", CONFLICT: "red", PENDING: "amber", FAILED: "gray", CANCELLED: "gray" }) as const)[s] ?? "gray";

export const statusLabel = (s: string) =>
  ({ CONFIRMED: "Confirmed", REQUESTED: "Request: confirm it", CONFLICT: "Paid, date taken", PENDING: "Paying now", FAILED: "Payment failed", CANCELLED: "Cancelled" })[s] ?? s;
