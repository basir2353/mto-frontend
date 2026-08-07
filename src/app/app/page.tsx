import { redirect } from "next/navigation";
import { appUrls } from "@mto/theme/apps";

/** App chooser → customer / driver apps (same old UI, separate ports). */
export default function AppWelcomeRedirect() {
  redirect(appUrls.customerApp);
}
