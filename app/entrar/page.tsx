import { redirect } from "next/navigation";
import { authState, isAuthed } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function Entrar() {
  if (await isAuthed()) redirect("/");
  const { hasPassword } = await authState();
  return <LoginForm hasPassword={hasPassword} />;
}
