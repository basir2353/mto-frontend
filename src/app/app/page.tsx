import { redirect } from "next/navigation";
import { appUrls, sameAppOrigin } from "@/lib/theme/apps";

/** App chooser → customer app (or marketing home on live). */
export default function AppWelcomeRedirect() {
  if (sameAppOrigin(appUrls.customerApp, appUrls.marketing)) {
    redirect("/");
  }
  redirect(appUrls.customerApp);
}
