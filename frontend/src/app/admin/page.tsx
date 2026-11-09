import { redirect } from "next/navigation";

// The dashboard lives inside the one-page app at /#admin; /admin is the address people type, so send them there.
export default function AdminPage() {
  redirect("/#admin");
}
