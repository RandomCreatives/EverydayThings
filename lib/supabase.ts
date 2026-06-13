/**
 * Supabase client — thin fetch-based wrapper over the Supabase REST API.
 * No SDK dependency required for the catalogue read queries.
 * For order writes and storage operations we expose a richer service client.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

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
  single: () => Promise<{ data: any | null; error: any | null }>;
  then: Promise<{ data: any[] | null; error: any | null }>['then'];
};

type InsertBuilder = {
  select: (columns?: string) => InsertSelectBuilder;
};

type InsertSelectBuilder = {
  single: () => Promise<{ data: any | null; error: any | null }>;
};

type StorageClient = {
  from: (bucket: string) => StorageBucketClient;
};

type StorageBucketClient = {
  upload: (path: string, body: any, opts: { contentType: string; upsert: boolean }) => Promise<{ error: any | null }>;
  createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: any | null }>;
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
        async single() {
          try {
            const fetchUrl = buildQueryUrl(table, filters, orderClause);
            const res = await fetch(fetchUrl, { headers, next: { revalidate: 60 } });
            const json = await res.json();
            if (!res.ok) return { data: null, error: json };
            const data = Array.isArray(json) ? json[0] : json;
            return { data: data ?? null, error: null };
          } catch (err: any) {
            return { data: null, error: { message: err.message } };
          }
        },
        then(onfulfilled, onrejected) {
          const fetchUrl = buildQueryUrl(table, filters, orderClause);
          return fetch(fetchUrl, { headers, next: { revalidate: 60 } })
            .then(async (res) => {
              const json = await res.json();
              if (!res.ok) return { data: null, error: json };
              return { data: Array.isArray(json) ? json : [json], error: null };
            })
            .catch((err: Error) => ({ data: null, error: { message: err.message } }))
            .then(onfulfilled, onrejected);
        },
      };

      const insertBuilder = (data: Record<string, unknown>): InsertBuilder => ({
        select(_columns = '*') {
          return {
            async single() {
              try {
                const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
                  method: 'POST',
                  headers: { ...headers, Prefer: 'return=representation' },
                  body: JSON.stringify(data),
                });
                const json = await res.json();
                if (!res.ok) return { data: null, error: json };
                const row = Array.isArray(json) ? json[0] : json;
                return { data: row ?? null, error: null };
              } catch (err: any) {
                return { data: null, error: { message: err.message } };
              }
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
            try {
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
            } catch (err: any) {
              return { error: { message: err.message } };
            }
          },
          async createSignedUrl(path, expiresIn) {
            try {
              const res = await fetch(`${url}/storage/v1/object/sign/${bucket}/${path}`, {
                method: 'POST',
                headers: { ...headers },
                body: JSON.stringify({ expiresIn }),
              });
              const json = await res.json();
              if (!res.ok) return { data: null, error: json };
              return { data: { signedUrl: json.signedURL || json.signedUrl }, error: null };
            } catch (err: any) {
              return { data: null, error: { message: err.message } };
            }
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

export const getSupabaseServiceClient = getSupabaseServiceRole;
