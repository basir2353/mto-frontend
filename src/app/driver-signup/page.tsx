import { redirect } from "next/navigation";
import { appUrls } from "@mto/theme/apps";

export default function DriverSignupRedirect() {
  redirect(`${appUrls.driverWeb}/signup`);
}
