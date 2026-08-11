import { redirect } from "next/navigation";
import { appUrls, sameAppOrigin } from "@/lib/theme/apps";

export default async function CustomerAppRedirect({
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

  // Live: no separate customer web — keep users on marketing (preserve quote params).
  if (sameAppOrigin(appUrls.customerApp, appUrls.marketing)) {
    redirect(`/${query ? `?${query}` : ""}`);
  }

  redirect(`${appUrls.customerApp}${query ? `?${query}` : ""}`);
}
