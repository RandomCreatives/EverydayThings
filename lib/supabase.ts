/**
 * Supabase clients.
 *
 * - `getSupabasePublic()`      — anon key, safe for server components (read-only catalogue data)
 * - `getSupabaseServiceRole()` — service role key, API routes only, never sent to the browser
 *
 * Both return null when the env vars are not configured so the app degrades
 * gracefully to the local sampleData fallback.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

// Minimal fetch-based Supabase REST client — no SDK dependency required.
// We do simple SELECT queries so a thin wrapper is sufficient.

type SupabaseClient = {
  from: (table: string) => QueryBuilder;
};

type QueryBuilder = {
  select: (columns?: string) => FilterBuilder;
};

type FilterBuilder = {
  eq: (column: string, value: string) => FilterBuilder;
  order: (column: string, opts?: { ascending: boolean }) => FilterBuilder;
  then: Promise<{ data: Json[] | null; error: { message: string } | null }>['then'];
};

function buildClient(url: string, key: string): SupabaseClient {
  function buildUrl(table: string, filters: string[], orderClause: string) {
    let path = `${url}/rest/v1/${table}`;
    const parts: string[] = [];
    if (filters.length) parts.push(...filters);
    if (orderClause) parts.push(orderClause);
    if (parts.length) path += `?${parts.join('&')}`;
    return path;
  }

  return {
    from(table: string) {
      const filters: string[] = [];
      let orderClause = '';

      const filterBuilder: FilterBuilder = {
        eq(column, value) {
          filters.push(`${column}=eq.${encodeURIComponent(value)}`);
          return filterBuilder;
        },
        order(column, opts) {
          orderClause = `order=${column}.${opts?.ascending === false ? 'desc' : 'asc'}`;
          return filterBuilder;
        },
        then(onfulfilled, onrejected) {
          const fetchUrl = buildUrl(table, filters, orderClause);
          return fetch(fetchUrl, {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            next: { revalidate: 60 }, // ISR — revalidate catalogue every 60s
          })
            .then((res) => res.json() as Promise<Json[]>)
            .then((data) => ({ data, error: null }))
            .catch((err: Error) => ({ data: null, error: { message: err.message } }))
            .then(onfulfilled, onrejected);
        },
      };

      return { select: (_columns = '*') => filterBuilder };
    },
  };
}

export function getSupabasePublic(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key || url.includes('replace-me')) return null;
  return buildClient(url, key);
}

export function getSupabaseServiceRole(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key || url.includes('replace-me')) return null;
  return buildClient(url, key);
}
