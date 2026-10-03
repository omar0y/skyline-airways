import { ResetPasswordForm, ResetRequestForm } from "@/components/AuthForm";
import { requestResetAction, resetPasswordAction } from "@/lib/actions/auth";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-12 md:px-6">
      <h1 className="mb-2 text-3xl font-bold text-primary">Reset password</h1>
      <p className="mb-6 text-sm">
        {token
          ? "Choose a new password for your account."
          : "Enter your email to generate a demo reset link."}
      </p>
      <div className="surface p-6">
        {token ? (
          <ResetPasswordForm token={token} action={resetPasswordAction} />
        ) : (
          <ResetRequestForm action={requestResetAction} />
        )}
      </div>
    </div>
  );
}
