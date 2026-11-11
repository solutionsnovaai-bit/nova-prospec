import { guard } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { providersUsage } from "@/lib/sources";

export const dynamic = "force-dynamic";

export async function GET() {
  const g = await guard();
  if (g) return g;
  try {
    return ok({ providers: await providersUsage() });
  } catch (e) {
    return fail(e);
  }
}
