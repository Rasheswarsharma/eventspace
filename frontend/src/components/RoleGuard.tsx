"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!isAuthenticated || !user)) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Verifying access privileges...</p>
        </div>
      </div>
    );
  }

  const authorized = allowedRoles.includes(user.role);

  const handleGoToDashboard = () => {
    switch (user.role) {
      case "super_admin":
        router.push("/dashboard/super-admin");
        break;
      case "society_president":
      case "society_admin":
        router.push("/dashboard/admin");
        break;
      case "volunteer":
        router.push("/dashboard/volunteer");
        break;
      case "judge":
        router.push("/dashboard/judge");
        break;
      case "student":
      default:
        router.push("/dashboard/student");
        break;
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-xl border border-slate-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Access Denied (403)
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
            Your account does not have permission to view this section of the EventSphere platform.
          </p>
          <div className="mt-6">
            <button
              onClick={handleGoToDashboard}
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "flex w-full justify-center py-5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
              )}
            >
              Go to My Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
