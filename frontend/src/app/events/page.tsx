"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/services/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, Calendar, Award, Layers, LogOut, User as UserIcon, Search, Compass, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";

interface MockEvent {
  id: string;
  title: string;
  date: string;
  registered: number;
  volunteers: number;
  venue: string;
  status: string;
  description: string;
  banner_url?: string;
}

export default function EventsPage() {
  const { user, clearAuth, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [events, setEvents] = useState<MockEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setMounted(true);
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data);
      } catch (err) {
        // Fallback mock events
        setEvents([
          {
            id: "1",
            title: "Diwali Fest 2026",
            date: "Nov 12, 2026",
            registered: 350,
            volunteers: 45,
            venue: "Main Auditorium",
            status: "Upcoming",
            description: "Celebrate the festival of lights with dynamic dance showcases, traditional decorations, and campus-wide cultural programs."
          },
          {
            id: "2",
            title: "WebDev Hackathon",
            date: "Oct 24, 2026",
            registered: 180,
            volunteers: 12,
            venue: "Computer Science Wing",
            status: "Active",
            description: "A 24-hour sprint to build next-generation web platforms solving real campus organizational problems."
          },
          {
            id: "3",
            title: "Inter-College Debate Cup",
            date: "Dec 05, 2026",
            registered: 95,
            volunteers: 8,
            venue: "Seminar Room B",
            status: "Upcoming",
            description: "Annual debate tournament bringing together delegates from across the region to discuss critical global policy updates."
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore
    } finally {
      clearAuth();
    }
  };

  const filteredEvents = events.filter(ev => 
    ev.title.toLowerCase().includes(search.toLowerCase()) || 
    ev.venue.toLowerCase().includes(search.toLowerCase()) ||
    ev.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xl font-bold tracking-tight">Eventspace</span>
          </Link>
          <div className="flex items-center gap-4">
            {mounted && user && (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "font-semibold text-indigo-600 dark:text-indigo-400")}
              >
                Go to Dashboard
              </Link>
            )}
            
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

      {/* Main Browse Section */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gradient">Explore Events</h1>
            <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
              Browse and register for upcoming and active campus organization events.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by title, venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 dark:text-zinc-400">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 space-y-4 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30">
            <Compass className="h-12 w-12 text-slate-300 dark:text-zinc-700" />
            <div>
              <h3 className="text-lg font-bold">No Events Found</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-xs mt-1">
                We couldn't find any events matching "{search}". Try searching for another keyword.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((ev) => (
              <div key={ev.id} className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between card-lift shadow-sm relative overflow-hidden">
                {/* Banner */}
                <div className="h-40 w-full bg-gradient-to-r from-indigo-500 to-purple-600 relative flex items-center justify-center text-white">
                  {ev.banner_url ? (
                    <img src={ev.banner_url} alt={ev.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center font-black tracking-wider text-sm opacity-80">
                      {ev.title.substring(0, 3).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        ev.status === "Active" || ev.status === "registration_open"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400"
                      )}>
                        {ev.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(ev.date).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold tracking-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {ev.title}
                    </h3>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800/60">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                        {ev.venue}
                      </span>
                    </div>

                    <Link
                      href={`/events/${ev.id}`}
                      className={cn(
                        buttonVariants({ variant: "default", size: "sm" }),
                        "w-full bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 font-bold"
                      )}
                    >
                      Register
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 dark:border-zinc-900 dark:bg-zinc-950 py-8 text-center text-sm text-slate-500">
        <p className="font-medium">Eventspace &copy; 2026</p>
      </footer>
    </div>
  );
}
