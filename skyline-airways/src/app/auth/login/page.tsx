import Link from "next/link";
import { LoginForm } from "@/components/AuthForm";
import { loginAction } from "@/lib/actions/auth";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 md:px-6">
      <h1 className="mb-2 text-3xl font-bold text-primary">Sign in</h1>
      <p className="mb-6 text-sm">
        New here?{" "}
        <Link href="/auth/register" className="font-bold text-primary underline">
          Create an account
        </Link>
      </p>
      <div className="surface p-6">
        <LoginForm action={loginAction} />
      </div>
    </div>
  );
}
