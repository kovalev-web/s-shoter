import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { routes } from "@/config/site";

export default async function RegisterPage() {
  const session = await auth();
  if (session) redirect(routes.board);

  return (
    <AuthCard
      title="Регистрация"
      description="Создайте аккаунт, чтобы начать сохранять скриншоты"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link href={routes.login} className="text-foreground underline underline-offset-4">
            Войти
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
