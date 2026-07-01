import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { routes } from "@/config/site";

export default async function Home() {
  const session = await auth();
  redirect(session ? routes.boards : routes.login);
}
