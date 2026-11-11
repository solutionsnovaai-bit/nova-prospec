import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "./settings";

export const COOKIE = "np_session";

function hashPassword(pw: string, salt = crypto.randomBytes(16).toString("hex")) {
  const h = crypto.scryptSync(pw, salt, 32).toString("hex");
  return `${salt}:${h}`;
}

function checkPassword(pw: string, stored: string) {
  const [salt, h] = stored.split(":");
  if (!salt || !h) return false;
  const test = crypto.scryptSync(pw, salt, 32);
  const ref = Buffer.from(h, "hex");
  return ref.length === test.length && crypto.timingSafeEqual(ref, test);
}

/** Senha pode vir da variável APP_PASSWORD ou ser criada no primeiro acesso. */
export async function authState() {
  const s = await getSettings();
  const envPw = process.env.APP_PASSWORD;
  return { hasPassword: !!envPw || !!s.passwordHash, envPw, settings: s };
}

export async function login(password: string): Promise<string | null> {
  const { envPw, settings } = await authState();
  let ok = false;
  if (envPw) ok = crypto.timingSafeEqual(Buffer.from(sha(password)), Buffer.from(sha(envPw)));
  else if (settings.passwordHash) ok = checkPassword(password, settings.passwordHash);
  if (!ok) return null;
  return newSession();
}

export async function setupPassword(password: string): Promise<string | null> {
  const { hasPassword } = await authState();
  if (hasPassword || password.length < 6) return null;
  await saveSettings({ passwordHash: hashPassword(password) });
  return newSession();
}

export async function changePassword(current: string, next: string) {
  const { envPw, settings } = await authState();
  if (envPw) return false;
  if (!settings.passwordHash || !checkPassword(current, settings.passwordHash) || next.length < 6) return false;
  await saveSettings({ passwordHash: hashPassword(next) });
  return true;
}

function sha(v: string) {
  return crypto.createHash("sha256").update(v).digest("hex");
}

/** Segredo da sessão: SESSION_SECRET, ou derivado da senha (trocar a senha derruba as sessões). */
async function secret() {
  const { envPw, settings } = await authState();
  const base = process.env.SESSION_SECRET || envPw || settings.passwordHash;
  return base ? sha("np:" + base) : null;
}

function sign(exp: number, key: string) {
  return crypto.createHmac("sha256", key).update(String(exp)).digest("base64url");
}

async function newSession() {
  const key = await secret();
  if (!key) return null;
  const exp = Date.now() + cookieOptions.maxAge * 1000;
  return `${exp}.${sign(exp, key)}`;
}

export async function logout(_token?: string) {
  /* sessão é o próprio cookie assinado: basta apagar o cookie */
}

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  const [expRaw, mac] = token.split(".");
  const exp = Number(expRaw);
  const key = await secret();
  if (!key || !mac || !exp || exp < Date.now()) return false;
  const ref = Buffer.from(sign(exp, key));
  const got = Buffer.from(mac);
  return ref.length === got.length && crypto.timingSafeEqual(ref, got);
}

/** Para rotas de API: devolve resposta 401 se não estiver logado. */
export async function guard(): Promise<NextResponse | null> {
  if (await isAuthed()) return null;
  return NextResponse.json({ error: "Faça login de novo." }, { status: 401 });
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 60,
};
