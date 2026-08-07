import { redirect } from "next/navigation";
import { appUrls } from "@mto/theme/apps";

/** Marketing site no longer hosts admin — redirect to admin app. */
export default function AdminRedirect() {
  redirect(appUrls.admin);
}
