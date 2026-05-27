import { QUOTES_PATH } from "../core/constants.js";

export async function fetchQuotes(path = QUOTES_PATH) {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  const data = await response.json();
  return data && Array.isArray(data.quotes) ? data.quotes : [];
}
