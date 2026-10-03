"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { ActionState } from "@/lib/actions/auth";

const initial: ActionState = { ok: false };

export function LoginForm({
  action,
  nextPath,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  nextPath?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      {state.errors?.length ? (
        <div className="error-summary" role="alert" tabIndex={-1}>
          <h2 id="error-title" className="mb-2 font-bold">
            There is a problem
          </h2>
          <ul className="list-disc pl-5">
            {state.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm">
        <Link href="/auth/reset-password" className="font-bold text-primary underline">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.errors?.length ? (
        <div className="error-summary" role="alert" tabIndex={-1}>
          <h2 className="mb-2 font-bold">There is a problem</h2>
          <ul className="list-disc pl-5">
            {state.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="salutation">Salutation</label>
          <select id="salutation" name="salutation" defaultValue="Mr">
            <option>Mr</option>
            <option>Ms</option>
            <option>Mrs</option>
            <option>Mx</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="firstName">First name</label>
          <input id="firstName" name="firstName" required autoComplete="given-name" />
        </div>
        <div className="field">
          <label htmlFor="lastName">Last name</label>
          <input id="lastName" name="lastName" required autoComplete="family-name" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export function ResetRequestForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.errors?.length ? (
        <div className="error-summary" role="alert" tabIndex={-1}>
          <ul className="list-disc pl-5">
            {state.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {state.message ? (
        <div className="rounded border border-border bg-muted p-3 text-sm text-foreground">
          <p>{state.message}</p>
          {state.resetLink ? (
            <p className="mt-2">
              <Link href={state.resetLink} className="font-bold underline">
                Open reset link
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Working…" : "Generate reset link"}
      </button>
    </form>
  );
}

export function ResetPasswordForm({
  token,
  action,
}: {
  token: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.errors?.length ? (
        <div className="error-summary" role="alert" tabIndex={-1}>
          <ul className="list-disc pl-5">
            {state.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {state.message ? (
        <div className="rounded border border-border bg-muted p-3 text-sm text-foreground">
          {state.message}{" "}
          <Link href="/auth/login" className="font-bold underline">
            Sign in
          </Link>
        </div>
      ) : null}
      <input type="hidden" name="token" value={token} />
      <div className="field">
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" minLength={8} required />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
