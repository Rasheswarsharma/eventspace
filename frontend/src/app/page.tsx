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
      <section className="flex flex-1 flex-col items-center justify-center text-center px-6 py-20 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <span>Platform Launch</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Eventspace
          </h1>
          <p className="text-xl text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            A modern platform for managing college societies, events, volunteers, registrations, certificates, attendance, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {mounted && user ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "default", size: "default" }),
                    "px-8 py-6 font-semibold bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  )}
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/events"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "px-8 py-6 font-semibold"
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
                    buttonVariants({ variant: "default", size: "default" }),
                    "px-8 py-6 font-semibold bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  )}
                >
                  Explore Events
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "px-8 py-6 font-semibold"
                  )}
                >
                  Register as Student
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-5xl px-6 py-20 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Core Capabilities</h2>
          <p className="text-slate-500 dark:text-zinc-400 max-w-lg mx-auto">
            Everything your campus organization needs to coordinate and execute events seamlessly.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="inline-flex p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Society Management</h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Streamline operations, delegate core tasks, and maintain cross-tenant data separation for every registered club.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="inline-flex p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Event Management</h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Toggle event modules dynamically and build customized registration forms matching the specific requirements of any fest.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="inline-flex p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Certificates & Attendance</h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Issue secure, verifiable PDF certificates with public verification lookups and track check-ins via camera QR scanning.
            </p>
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
