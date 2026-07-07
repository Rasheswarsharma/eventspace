"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [message, setMessage] = useState(
    token ? "Verifying your email address..." : "Verification token is missing from the link."
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const verifyToken = async () => {
      try {
        await api.post(`/auth/verify-email?token=${token}`);
        setStatus("success");
        setMessage("Your email address has been successfully verified! You can now log in.");
      } catch (err) {
        setStatus("error");
        const error = err as { response?: { data?: { detail?: string } } };
        const detail = error.response?.data?.detail;
        setMessage(typeof detail === "string" ? detail : "Verification failed or token expired.");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="w-full max-w-md space-y-8 rounded-xl border border-slate-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm text-center">
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verifying...</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">{message}</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Account Activated!</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed px-4">{message}</p>
          <div className="pt-4 w-full">
            <button
              onClick={() => router.push("/login")}
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "flex w-full justify-center py-6 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors"
              )}
            >
              Go to Login
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <XCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verification Failed</h2>
          <p className="text-sm text-red-500 dark:text-red-400 leading-relaxed px-4">{message}</p>
          <div className="pt-4 w-full flex flex-col gap-2">
            <button
              onClick={() => router.push("/register")}
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "flex w-full justify-center py-6 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors"
              )}
            >
              Register Again
            </button>
            <button
              onClick={() => router.push("/login")}
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "flex w-full justify-center py-6 text-sm font-semibold rounded-lg cursor-pointer"
              )}
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

VerifyEmailContent.displayName = "VerifyEmailContent";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm text-center py-12">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="mt-4 text-sm text-slate-500">Loading page...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
