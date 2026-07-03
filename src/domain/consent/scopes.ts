export function parseConnectionScopes(scopes: unknown): string[] {
  if (Array.isArray(scopes)) {
    return scopes.filter((scope): scope is string => typeof scope === "string");
  }

  if (typeof scopes === "string") {
    try {
      const parsed = JSON.parse(scopes) as unknown;
      return parseConnectionScopes(parsed);
    } catch {
      return scopes
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export function formatConnectionScopes(scopes: unknown): string {
  return parseConnectionScopes(scopes).join(", ");
}

export function connectionScopesToDb(scopes: string[]): string[] {
  return scopes;
}
