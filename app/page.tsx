import { redirect } from "next/navigation";

// Root page — redirect to login (middleware handles auth check)
export default function Home() {
  redirect("/login");
}
