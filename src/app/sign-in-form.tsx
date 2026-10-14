"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { signIn } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const SignInForm = () => {
  const [state, action, pending] = useActionState(signIn, { error: "" });
  const [email, setEmail] = useState("");
  return (
    <form
      aria-describedby="sign-in-error"
      action={action}
      className="flex flex-col gap-3.5"
    >
      <div className="grid gap-1.5">
        <label className="text-label text-body font-emphasis" htmlFor="email">
          Email
        </label>
        <Input
          autoComplete="username"
          id="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
          maxLength={254}
        />
      </div>
      <div className="grid gap-1.5">
        <label
          className="text-label text-body font-emphasis"
          htmlFor="password"
        >
          Password
        </label>
        <Input
          autoComplete="current-password"
          id="password"
          name="password"
          required
          type="password"
          maxLength={1024}
        />
      </div>
      <p
        aria-live="polite"
        className="text-destructive min-h-4 text-xs empty:hidden"
        id="sign-in-error"
      >
        {state.error}
      </p>
      <Button className="w-full" disabled={pending} size="lg" type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-muted-foreground text-xs">
        Use the account your instructor gave you. For help signing in, contact
        your instructor. See{" "}
        <Link className="text-ai-ink hover:underline" href="/privacy">
          what we store and who sees it
        </Link>
        .
      </p>
    </form>
  );
};
