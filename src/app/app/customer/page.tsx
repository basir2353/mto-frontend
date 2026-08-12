import { redirect } from "next/navigation";

/** Customer app entry → in-site booking. */
export default function CustomerAppEntryRedirect() {
  redirect("/book");
}
