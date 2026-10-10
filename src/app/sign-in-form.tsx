"use client";

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
      className="flex flex-col gap-4"
    >
      <div className="grid gap-2">
        <label className="text-body font-semibold" htmlFor="email">
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
      <div className="grid gap-2">
        <label className="text-body font-semibold" htmlFor="password">
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
        className="text-destructive text-sm"
        id="sign-in-error"
      >
        {state.error}
      </p>
      <Button className="w-fit" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-muted-foreground text-base">
        Use the account provided by your instructor. For help signing in,
        contact your instructor.
      </p>
    </form>
  );
};
