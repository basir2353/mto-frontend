import { redirect } from "next/navigation";
import { appUrls } from "@mto/theme/apps";

export default function DriverAppEntryRedirect() {
  redirect(appUrls.driverApp);
}
