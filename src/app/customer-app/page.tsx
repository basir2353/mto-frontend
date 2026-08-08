import { redirect } from "next/navigation";
import { appUrls } from "@/lib/theme/apps";

export default function CustomerAppRedirect() {
  redirect(appUrls.customerApp);
}
