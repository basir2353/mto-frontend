import { redirect } from "next/navigation";

/** App chooser → in-site booking. */
export default function AppWelcomeRedirect() {
  redirect("/book");
}
