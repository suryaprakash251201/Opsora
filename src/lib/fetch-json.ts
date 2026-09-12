/**
 * Shared client-side fetch helper. Throws `Request failed with <status>`
 * for non-2xx responses so every hook surfaces the same error shape to
 * TanStack Query (and its retry/error UI) instead of each hook rolling
 * its own status check.
 */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}
