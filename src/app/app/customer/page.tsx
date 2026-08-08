import { redirect } from "next/navigation";
import { appUrls } from "@/lib/theme/apps";

export default function CustomerAppEntryRedirect() {
  redirect(appUrls.customerApp);
}
