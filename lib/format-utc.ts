export function formatUtc(dateString: string | null | undefined): string {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toISOString().replace("T", " ").replace(".000Z", " UTC");
}
