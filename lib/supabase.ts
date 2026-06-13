/**
 * Supabase client — thin fetch-based wrapper over the Supabase REST API.
 * No SDK dependency required for the catalogue read queries.
 * For order writes and storage operations we expose a richer service client.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ── OrderInsert type (matches schema.sql orders table) ────────────────────────
export type OrderInsert = {
  tx_ref: string;
  provider: string;
  image_code: string;
  size_id: string;
  print_dimensions: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  amount_etb: number;
  currency: 'ETB';
  payment_status: string;
  fulfillment_status: string;
  receipt_url: string | null;
  metadata: Record<string, unknown>;
};

// ── Minimal REST client ───────────────────────────────────────────────────────
type SupabaseRestClient = {
  from: (table: string) => QueryBuilder;
  storage: StorageClient;
};

type QueryBuilder = {
  select: (columns?: string) => FilterBuilder;
  insert: (data: Record<string, unknown>) => InsertBuilder;
};

type FilterBuilder = {
  eq: (column: string, value: string) => FilterBuilder;
  order: (column: string, opts?: { ascending: boolean }) => FilterBuilder;
  single: () => Promise<{ data: Json | null; error: { message: string } | null }>;
  then: Promise<{ data: Json[] | null; error: { message: string } | null }>['then'];
};

type InsertBuilder = {
  select: (columns?: string) => InsertSelectBuilder;
};

type InsertSelectBuilder = {
  single: () => Promise<{ data: Json | null; error: { message: string } | null }>;
};

type StorageClient = {
  from: (bucket: string) => StorageBucketClient;
};

type StorageBucketClient = {
  upload: (path: string, body: Buffer, opts: { contentType: string; upsert: boolean }) => Promise<{ error: { message: string } | null }>;
  createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
};

function buildRestClient(url: string, key: string): SupabaseRestClient {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  function buildQueryUrl(table: string, filters: string[], orderClause: string) {
    let path = `${url}/rest/v1/${table}`;
    const parts = [...filters];
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
        single() {
          const fetchUrl = buildQueryUrl(table, filters, orderClause);
          return fetch(fetchUrl, { headers, next: { revalidate: 60 } })
            .then((res) => res.json() as Promise<Json[]>)
            .then(([data]) => ({ data: data ?? null, error: null }))
            .catch((err: Error) => ({ data: null, error: { message: err.message } }));
        },
        then(onfulfilled, onrejected) {
          const fetchUrl = buildQueryUrl(table, filters, orderClause);
          return fetch(fetchUrl, { headers, next: { revalidate: 60 } })
            .then((res) => res.json() as Promise<Json[]>)
            .then((data) => ({ data, error: null }))
            .catch((err: Error) => ({ data: null, error: { message: err.message } }))
            .then(onfulfilled, onrejected);
        },
      };

      const insertBuilder = (data: Record<string, unknown>): InsertBuilder => ({
        select(_columns = '*') {
          return {
            single() {
              return fetch(`${url}/rest/v1/${table}?select=*`, {
                method: 'POST',
                headers: { ...headers, Prefer: 'return=representation' },
                body: JSON.stringify(data),
              })
                .then((res) => res.json() as Promise<Json[]>)
                .then(([row]) => ({ data: row ?? null, error: null }))
                .catch((err: Error) => ({ data: null, error: { message: err.message } }));
            },
          };
        },
      });

      return {
        select: (_columns = '*') => filterBuilder,
        insert: insertBuilder,
      };
    },

    storage: {
      from(bucket: string): StorageBucketClient {
        return {
          async upload(path, body, opts) {
            const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
              method: 'POST',
              headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                'Content-Type': opts.contentType,
                'x-upsert': String(opts.upsert),
              },
              body,
            });
            if (!res.ok) {
              const msg = await res.text();
              return { error: { message: msg } };
            }
            return { error: null };
          },
          async createSignedUrl(path, expiresIn) {
            const res = await fetch(`${url}/storage/v1/object/sign/${bucket}/${path}`, {
              method: 'POST',
              headers: { ...headers },
              body: JSON.stringify({ expiresIn }),
            });
            if (!res.ok) {
              const msg = await res.text();
              return { data: null, error: { message: msg } };
            }
            const json = (await res.json()) as { signedURL: string };
            return { data: { signedUrl: json.signedURL }, error: null };
          },
        };
      },
    },
  };
}

export function getSupabasePublic(): SupabaseRestClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key || url.includes('replace-me')) return null;
  return buildRestClient(url, key);
}

export function getSupabaseServiceRole(): SupabaseRestClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key || url.includes('replace-me')) return null;
  return buildRestClient(url, key);
}

// Alias used by lib/orders.ts
export const getSupabaseServiceClient = getSupabaseServiceRole;
