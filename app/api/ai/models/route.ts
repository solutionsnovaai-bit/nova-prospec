import { guard } from "@/lib/auth";
import { listModels, PROVIDERS } from "@/lib/ai";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const g = await guard();
  if (g) return g;
  try {
    return ok({ models: await listModels() });
  } catch (e) {
    return fail(e, 400);
  }
}

export async function POST() {
  return ok({ providers: Object.fromEntries(Object.entries(PROVIDERS).map(([k, v]) => [k, { label: v.label, baseUrl: v.baseUrl, suggested: v.suggested, signup: v.signup, web: v.web }])) });
}
