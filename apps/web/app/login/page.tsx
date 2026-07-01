import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { routes } from "@/config/site";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect(routes.board);

  return (
    <AuthCard
      title="Вход"
      description="Войдите, чтобы открыть свою доску скриншотов"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link href={routes.register} className="text-foreground underline underline-offset-4">
            Зарегистрироваться
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
