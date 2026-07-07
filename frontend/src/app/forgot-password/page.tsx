"use client";

import React, { useState } from "react";
import { api } from "@/services/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      const detail = error.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to send reset link. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-slate-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
            Enter your email to receive a recovery link.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <h3 className="text-lg font-bold">Email Sent</h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              If the email <strong>{email}</strong> is registered, a password recovery link has been logged/sent. Please check your inbox or server logs.
            </p>
            <div className="pt-4 w-full">
              <a
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "flex w-full justify-center py-6 text-sm font-semibold rounded-lg"
                )}
              >
                Back to Login
              </a>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="block w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  placeholder="johndoe@university.edu"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "flex w-full justify-center py-6 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer rounded-lg select-none"
                )}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Send Recovery Link
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {!success && (
          <div className="text-center text-sm text-slate-500 dark:text-zinc-400">
            Remembered your password?{" "}
            <a
              href="/login"
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Login here
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
