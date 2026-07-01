export interface OpenFinanceInstitution {
  id: string;
  name: string;
  color: string;
}

export const OPEN_FINANCE_INSTITUTIONS: OpenFinanceInstitution[] = [
  { id: "nubank", name: "Nubank", color: "#820AD1" },
  { id: "itau", name: "Itaú", color: "#EC7000" },
  { id: "bradesco", name: "Bradesco", color: "#CC092F" },
  { id: "santander", name: "Santander", color: "#EC0000" },
  { id: "bb", name: "Banco do Brasil", color: "#FFCC00" },
  { id: "caixa", name: "Caixa", color: "#005CA9" },
  { id: "inter", name: "Banco Inter", color: "#FF7A00" },
  { id: "c6", name: "C6 Bank", color: "#1A1A1A" },
  { id: "xp", name: "XP", color: "#000000" },
  { id: "safra", name: "Safra", color: "#1E3A5F" },
  { id: "btg", name: "BTG Pactual", color: "#002C4D" },
  { id: "picpay", name: "PicPay", color: "#21C25E" },
];

export function findInstitution(id: string): OpenFinanceInstitution | undefined {
  return OPEN_FINANCE_INSTITUTIONS.find((institution) => institution.id === id);
}

export function filterInstitutions(query: string): OpenFinanceInstitution[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return OPEN_FINANCE_INSTITUTIONS;
  }

  return OPEN_FINANCE_INSTITUTIONS.filter((institution) =>
    institution.name.toLowerCase().includes(normalized),
  );
}
