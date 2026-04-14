"use client";

import { useActionState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { logIn } from "@/lib/auth/actions";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import type { AuthResult } from "@/lib/auth/actions";

const initialState: AuthResult = { error: null };

function LoginContent() {
  const [state, formAction, isPending] = useActionState(logIn, initialState);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for signup success
    if (searchParams.get("signup") === "success") {
      toast.success(
        "Account created! Check your inbox for the verification link.",
        {
          toastId: "signup-success", // Prevent duplicate toast
        },
      );
    }

    // Check for successful verification
    if (searchParams.get("verified") === "true") {
      toast.success("Email verified successfully! You can now log in.", {
        toastId: "verification-success",
      });
    }

    // Check for verification error
    if (searchParams.get("error") === "verification-failed") {
      toast.error(
        "Verification failed. The link may have expired or is invalid.",
        {
          toastId: "verification-error",
        },
      );
    }
  }, [searchParams]);

  useEffect(() => {
    // Show error toast
    if (state.error?.field === "general") {
      toast.error(state.error.message);
    }
  }, [state.error]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-black text-slate-900 tracking-tightest leading-tight mb-2">
          Welcome back.
        </h1>
        <p className="text-slate-500 font-bold text-base leading-relaxed">
          Log in to manage your production queue.
        </p>
      </div>

      <form action={formAction} className="space-y-6" noValidate>
        <div className="space-y-3">
          <Input
            label="Corporate Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            error={
              state.error?.field === "email" ? state.error.message : undefined
            }
            required
            className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 transition-all font-bold"
          />

          <div className="space-y-2">
            <Input
              label="Secure Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              error={
                state.error?.field === "password"
                  ? state.error.message
                  : undefined
              }
              required
              className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 transition-all font-bold"
            />
          </div>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={isPending}
          className="h-16 rounded-[24px] bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-2xl shadow-blue-500/20 active:scale-[0.98] transition-all"
        >
          {isPending ? "Authenticating..." : "Enter Dashboard →"}
        </Button>
      </form>

      <div className="pt-10 border-t border-slate-100 flex flex-col items-center gap-6">
        <p className="text-sm font-bold text-slate-400">
          New to the platform?{" "}
          <Link
            href="/signup"
            className="text-slate-900 font-black hover:text-blue-600 transition-colors border-b-2 border-slate-100 hover:border-blue-600 pb-1 translate-y-0 hover:-translate-y-1 inline-block"
          >
            Create an Enterprise Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-8">
      <div className="h-8 w-3/4 bg-slate-100 rounded-lg" />
      <div className="h-4 w-1/2 bg-slate-100 rounded-lg" />
      <div className="space-y-6">
        <div className="h-14 bg-slate-100 rounded-2xl" />
        <div className="h-14 bg-slate-100 rounded-2xl" />
        <div className="h-16 bg-slate-100 rounded-[24px]" />
      </div>
    </div>}>
      <LoginContent />
    </Suspense>
  );
}
