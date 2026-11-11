import "server-only";
import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}

export function fail(e: unknown, fallback = 500) {
  const status = (e as { status?: number })?.status ?? fallback;
  const message = e instanceof Error ? e.message : "Algo deu errado.";
  return NextResponse.json({ error: message }, { status: status >= 400 && status < 600 ? status : 500 });
}

export async function body<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
