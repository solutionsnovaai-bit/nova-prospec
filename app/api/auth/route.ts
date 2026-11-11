import { cookies } from "next/headers";
import { authState, changePassword, COOKIE, cookieOptions, isAuthed, login, logout, setupPassword } from "@/lib/auth";
import { body, fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const { hasPassword } = await authState();
  return ok({ hasPassword, authed: await isAuthed() });
}

export async function POST(req: Request) {
  try {
    const b = await body<{ password?: string; mode?: "setup" | "login" | "change"; current?: string }>(req);
    const pw = String(b.password ?? "");
    if (b.mode === "change") {
      if (!(await isAuthed())) return fail(Object.assign(new Error("Faça login de novo."), { status: 401 }));
      const done = await changePassword(String(b.current ?? ""), pw);
      if (!done) return fail(Object.assign(new Error("Senha atual errada, ou a nova tem menos de 6 caracteres."), { status: 400 }));
      return ok({ ok: true });
    }
    const token = b.mode === "setup" ? await setupPassword(pw) : await login(pw);
    if (!token) {
      const msg = b.mode === "setup" ? "A senha precisa de pelo menos 6 caracteres." : "Senha errada.";
      return fail(Object.assign(new Error(msg), { status: 401 }));
    }
    (await cookies()).set(COOKIE, token, cookieOptions);
    return ok({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE() {
  const jar = await cookies();
  await logout(jar.get(COOKIE)?.value);
  jar.delete(COOKIE);
  return ok({ ok: true });
}
