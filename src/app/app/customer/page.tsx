import { redirect } from "next/navigation";
import { appUrls, sameAppOrigin } from "@/lib/theme/apps";

export default function CustomerAppEntryRedirect() {
  if (sameAppOrigin(appUrls.customerApp, appUrls.marketing)) {
    redirect("/");
  }
  redirect(appUrls.customerApp);
}
