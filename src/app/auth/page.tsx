import { redirect } from "next/navigation";
import { appUrls } from "@/lib/theme/apps";

/** Auth lives on the customer app so the session stays on the same origin. */
export default async function AuthRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  const query = qs.toString();
  redirect(`${appUrls.customerApp}/auth${query ? `?${query}` : ""}`);
}
