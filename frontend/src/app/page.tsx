"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/services/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, Calendar, Award, Layers, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { user, clearAuth, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState<boolean>(false);

  // Set mounted flag to handle server-client hydration mismatches gracefully
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    
    // Check if user session can be recovered on initial load
    const checkSession = async () => {
      try {
        const res = await api.get("/auth/me");
        // If successful, we can fetch token from session or state
        // In stateless setups, calling refresh gives the access token
        const refreshRes = await api.post("/auth/refresh");
        setAuth(res.data, refreshRes.data.access_token);
      } catch {
        // Clear auth if session verification fails
        clearAuth();
      }
    };
    checkSession();

    return () => clearTimeout(timer);
  }, [setAuth, clearAuth]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuth();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans">
      {/* Header / Nav */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xl font-bold tracking-tight">Eventspace</span>
          </div>
          <div className="flex items-center gap-4">
            {mounted && user && (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "font-semibold text-indigo-600 dark:text-indigo-400")}
              >
                Go to Dashboard
              </Link>
            )}
            <Link
              href="/events"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Browse Events
            </Link>
            
            {mounted && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  <UserIcon className="h-4 w-4" />
                  <span>Hi, {user.full_name.split(" ")[0]}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={cn(buttonVariants({ variant: "default", size: "sm" }))}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center text-center px-6 py-24 bg-gradient-premium border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
            <span>✨ Platform Launch</span>
          </div>
          <h1 className="text-6xl font-black tracking-tight text-slate-900 dark:text-white sm:text-7xl">
            Welcome to <span className="text-gradient">Eventspace</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
            A modern, multi-tenant portal for college organizations. Coordinate volunteers, verify judge rubrics, manage budgets, and issue cryptographic certificates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {mounted && user ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "px-8 py-6 font-semibold bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/10"
                  )}
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/events"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "px-8 py-6 font-semibold shadow-sm"
                  )}
                >
                  Explore Events
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/events"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "px-8 py-6 font-semibold bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/10"
                  )}
                >
                  Explore Events
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "px-8 py-6 font-semibold shadow-sm"
                  )}
                >
                  Register as Student
                </Link>
              </>
            )}
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50 dark:border-zinc-900 dark:bg-zinc-950 py-8 text-center text-sm text-slate-500">
        <p className="font-medium">Eventspace &copy; 2026</p>
      </footer>
    </div>
  );
}
