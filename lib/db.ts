import "server-only";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

/**
 * Armazenamento simples por coleção (documentos JSON).
 * - Com DATABASE_URL / POSTGRES_URL: Postgres (Neon pelo Vercel, Supabase…). Cria a tabela sozinho.
 * - Sem banco: arquivo JSON (.data/db.json em dev, /tmp no Vercel — temporário).
 */

export type Collection = "leads" | "config" | "searches" | "chats";

interface Store {
  kind: "postgres" | "supabase" | "arquivo";
  persistent: boolean;
  all<T>(col: Collection): Promise<T[]>;
  get<T>(col: Collection, id: string): Promise<T | null>;
  put<T>(col: Collection, id: string, data: T): Promise<void>;
  putMany<T>(col: Collection, items: { id: string; data: T }[]): Promise<void>;
  del(col: Collection, id: string): Promise<void>;
}

const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || "";

function pgStore(url: string): Store {
  const local = /localhost|127\.0\.0\.1/.test(url);
  const sql = postgres(url, {
    ssl: local ? false : "require",
    prepare: false,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  let ready: Promise<unknown> | null = null;
  const ensure = () =>
    (ready ??= sql`
      create table if not exists np_records (
        col text not null,
        id text not null,
        data jsonb not null,
        updated_at timestamptz not null default now(),
        primary key (col, id)
      )`.catch((e) => {
      ready = null;
      throw e;
    }));

  return {
    kind: "postgres",
    persistent: true,
    async all<T>(col: Collection) {
      await ensure();
      const rows = await sql<{ data: T }[]>`select data from np_records where col = ${col}`;
      return rows.map((r) => r.data);
    },
    async get<T>(col: Collection, id: string) {
      await ensure();
      const rows = await sql<{ data: T }[]>`select data from np_records where col = ${col} and id = ${id}`;
      return rows[0]?.data ?? null;
    },
    async put<T>(col: Collection, id: string, data: T) {
      await ensure();
      await sql`
        insert into np_records (col, id, data, updated_at)
        values (${col}, ${id}, ${sql.json(data as never)}, now())
        on conflict (col, id) do update set data = excluded.data, updated_at = now()`;
    },
    async putMany<T>(col: Collection, items: { id: string; data: T }[]) {
      if (!items.length) return;
      await ensure();
      await sql.begin(async (tx) => {
        for (const it of items) {
          await tx`
            insert into np_records (col, id, data, updated_at)
            values (${col}, ${it.id}, ${tx.json(it.data as never)}, now())
            on conflict (col, id) do update set data = excluded.data, updated_at = now()`;
        }
      });
    },
    async del(col: Collection, id: string) {
      await ensure();
      await sql`delete from np_records where col = ${col} and id = ${id}`;
    },
  };
}

function fileStore(): Store {
  const onVercel = !!process.env.VERCEL;
  const file = onVercel ? "/tmp/nova-prospec.json" : path.join(process.cwd(), ".data", "db.json");
  let cache: Record<string, Record<string, unknown>> | null = null;

  const load = () => {
    if (cache) return cache;
    try {
      cache = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      cache = {};
    }
    return cache!;
  };
  const save = () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = file + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(cache));
    fs.renameSync(tmp, file);
  };
  const colOf = (col: Collection) => (load()[col] ??= {});

  return {
    kind: "arquivo",
    persistent: !onVercel,
    async all<T>(col: Collection) {
      return Object.values(colOf(col)) as T[];
    },
    async get<T>(col: Collection, id: string) {
      return (colOf(col)[id] as T) ?? null;
    },
    async put<T>(col: Collection, id: string, data: T) {
      colOf(col)[id] = data;
      save();
    },
    async putMany<T>(col: Collection, items: { id: string; data: T }[]) {
      const c = colOf(col);
      for (const it of items) c[it.id] = it.data;
      save();
    },
    async del(col: Collection, id: string) {
      delete colOf(col)[id];
      save();
    },
  };
}

/** Supabase pela API REST: tabela np_records protegida por RLS que exige o cabeçalho x-np-secret. */
function supabaseStore(url: string, key: string, secretHeader: string): Store {
  const base = `${url.replace(/\/+$/, "")}/rest/v1/np_records`;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "x-np-secret": secretHeader, "Content-Type": "application/json" };
  const call = async (path: string, init?: RequestInit) => {
    const res = await fetch(base + path, { ...init, headers: { ...headers, ...(init?.headers ?? {}) }, cache: "no-store" });
    if (!res.ok) throw new Error(`Banco respondeu ${res.status}: ${(await res.text()).slice(0, 160)}`);
    return res;
  };
  const q = (v: string) => encodeURIComponent(v);
  const upsert = (rows: { col: string; id: string; data: unknown }[]) =>
    call("?on_conflict=col,id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows.map((r) => ({ ...r, updated_at: new Date().toISOString() }))),
    });
  return {
    kind: "supabase",
    persistent: true,
    async all<T>(col: Collection) {
      const out: T[] = [];
      for (let from = 0; ; from += 1000) {
        const res = await call(`?select=data&col=eq.${q(col)}&order=id`, { headers: { Range: `${from}-${from + 999}` } });
        const rows = (await res.json()) as { data: T }[];
        out.push(...rows.map((r) => r.data));
        if (rows.length < 1000) break;
      }
      return out;
    },
    async get<T>(col: Collection, id: string) {
      const res = await call(`?select=data&col=eq.${q(col)}&id=eq.${q(id)}&limit=1`);
      const rows = (await res.json()) as { data: T }[];
      return rows[0]?.data ?? null;
    },
    async put<T>(col: Collection, id: string, data: T) {
      await upsert([{ col, id, data }]);
    },
    async putMany<T>(col: Collection, items: { id: string; data: T }[]) {
      for (let i = 0; i < items.length; i += 200) await upsert(items.slice(i, i + 200).map((it) => ({ col, id: it.id, data: it.data })));
    },
    async del(col: Collection, id: string) {
      await call(`?col=eq.${q(col)}&id=eq.${q(id)}`, { method: "DELETE" });
    },
  };
}

const SB_URL = process.env.SUPABASE_URL || "";
const SB_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || "";

const g = globalThis as unknown as { __npStore?: Store };
export const db: Store = (g.__npStore ??= DB_URL ? pgStore(DB_URL) : SB_URL && SB_KEY ? supabaseStore(SB_URL, SB_KEY, process.env.NP_DB_SECRET || "") : fileStore());
