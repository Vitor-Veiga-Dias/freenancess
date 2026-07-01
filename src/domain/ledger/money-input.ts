export function parseMoneyInput(value: string): number | null {
  const trimmed = value.trim().replace(/\s/g, "");

  if (!trimmed) {
    return null;
  }

  let normalized = trimmed;

  if (/,\d{1,2}$/.test(trimmed)) {
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (trimmed.includes(",") && !trimmed.includes(".")) {
    normalized = trimmed.replace(",", ".");
  }

  const parsed = Number.parseFloat(normalized);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return roundMoney(parsed);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatMoneyInput(value: number): string {
  return roundMoney(value).toFixed(2).replace(".", ",");
}
