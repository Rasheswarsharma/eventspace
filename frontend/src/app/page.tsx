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
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80 sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 dark:bg-indigo-500">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-zinc-300">
              Eventspace
            </span>
          </div>
          <div className="flex items-center gap-5">
            {mounted && user && (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300")}
              >
                Go to Dashboard
              </Link>
            )}
            <Link
              href="/events"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100")}
            >
              Browse Events
            </Link>
            
            {mounted && user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full">
                  <UserIcon className="h-4 w-4 text-indigo-500" />
                  <span>Hi, {user.full_name.split(" ")[0]}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:text-red-400 dark:hover:border-red-900/30 transition-all duration-300")}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "font-semibold")}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={cn(buttonVariants({ variant: "default", size: "sm" }), "font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/10 dark:bg-indigo-500 dark:hover:bg-indigo-600")}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-1 flex-col justify-center px-6 py-20 md:px-12 bg-gradient-premium border-b border-slate-200/60 dark:border-zinc-900 overflow-hidden">
        <div className="mx-auto max-w-7xl w-full grid md:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="md:col-span-7 space-y-8 text-left animate-in fade-in slide-in-from-left-4 duration-1000">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/20">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>✨ Live Campus Workspace</span>
            </div>
            
            <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl md:text-7xl leading-tight">
              Welcome to <br />
              <span className="text-gradient">Eventspace</span>
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-zinc-400 max-w-xl leading-relaxed font-normal">
              A modern, multi-tenant portal for college organizations. Coordinate volunteers, verify judge rubrics, manage budgets, and issue cryptographic certificates.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              {mounted && user ? (
                <>
                  <Link
                    href="/dashboard"
                    className={cn(
                      buttonVariants({ variant: "default", size: "lg" }),
                      "px-8 py-6 font-semibold bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    )}
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    href="/events"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "px-8 py-6 font-semibold hover:bg-slate-100 dark:hover:bg-zinc-900 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
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
                      "px-8 py-6 font-semibold bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    )}
                  >
                    Explore Events
                  </Link>
                  <Link
                    href="/register"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "px-8 py-6 font-semibold hover:bg-slate-100 dark:hover:bg-zinc-900 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    )}
                  >
                    Register as Student
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Visual Column */}
          <div className="md:col-span-5 relative w-full flex justify-center items-center animate-in fade-in slide-in-from-right-4 duration-1000 delay-200">
            {/* Glow Background */}
            <div className="absolute w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl -z-10 dark:bg-indigo-500/10"></div>
            <div className="absolute w-60 h-60 bg-purple-400/20 rounded-full blur-3xl -z-10 dark:bg-purple-500/10"></div>
            
            {/* Premium Stat Cards Grid */}
            <div className="w-full max-w-sm space-y-4">
              <div className="glassy-panel p-5 rounded-2xl shadow-xl flex items-center gap-4 hover:scale-[1.03] transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-white">50+</h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Campus Societies Integrated</p>
                </div>
              </div>

              <div className="glassy-panel p-5 rounded-2xl shadow-xl flex items-center gap-4 hover:scale-[1.03] transition-all duration-300 translate-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-white">10k+</h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Successful Event Registrations</p>
                </div>
              </div>

              <div className="glassy-panel p-5 rounded-2xl shadow-xl flex items-center gap-4 hover:scale-[1.03] transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-white">100%</h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Cryptographic Certificates</p>
                </div>
              </div>
            </div>

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
