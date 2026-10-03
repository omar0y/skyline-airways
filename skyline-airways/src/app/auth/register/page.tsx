import Link from "next/link";
import { RegisterForm } from "@/components/AuthForm";
import { registerAction } from "@/lib/actions/auth";

export const metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 md:px-6">
      <h1 className="mb-2 text-3xl font-bold text-primary">Create account</h1>
      <p className="mb-6 text-sm">
        Already registered?{" "}
        <Link href="/auth/login" className="font-bold text-primary underline">
          Sign in
        </Link>
      </p>
      <div className="surface p-6">
        <RegisterForm action={registerAction} />
      </div>
    </div>
  );
}
