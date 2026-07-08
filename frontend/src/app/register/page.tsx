"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Lock, Mail, User as UserIcon, Phone, ArrowRight, Loader2, 
  Building, Eye, EyeOff, Link as LinkIcon, Sparkles, CheckCircle2 
} from "lucide-react";
import Link from "next/link";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const inviteToken = searchParams.get("token");

  // Signup form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    college: "",
    phone: "",
    role: "student", // student or society_president (Society Admin / Organizer)
    referralCode: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Onboarding states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    name: "",
    shortName: "",
    description: "",
    logoUrl: "",
    initialEventName: "",
  });
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingSuccess, setOnboardingSuccess] = useState(false);

  // Load invitation details if token is present
  useEffect(() => {
    if (inviteToken) {
      const verifyInvite = async () => {
        try {
          const res = await api.get(`/invitations/verify?token=${inviteToken}`);
          if (res.data) {
            setFormData((prev) => ({
              ...prev,
              email: res.data.email || prev.email,
              role: res.data.role || prev.role,
            }));
          }
        } catch {
          setError("The invitation token is invalid or expired.");
        }
      };
      verifyInvite();
    }
  }, [inviteToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOnboardingData((prev) => ({
          ...prev,
          logoUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.college || !formData.password) {
      setError("Please fill out all required fields.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Submit Registration
      await api.post("/auth/register", {
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null,
        college: formData.college,
        role: formData.role,
        referral_code: formData.referralCode || null,
        invite_token: inviteToken || null,
      });

      setSuccess(true);

      // If they signed up as Organizer (Society President), log them in immediately to complete onboarding
      if (formData.role === "society_president") {
        try {
          const loginRes = await api.post("/auth/login", {
            email: formData.email,
            password: formData.password,
          });
          const { user, access_token } = loginRes.data;
          setAuth(user, access_token);
          // Switch view to Society Onboarding
          setTimeout(() => {
            setShowOnboarding(true);
            setLoading(false);
          }, 300);
        } catch {
          // Fallback if login fails
          setTimeout(() => {
            router.push("/login");
          }, 300);
        }
      } else {
        // Participant or other roles: redirect to Login
        setTimeout(() => {
          router.push("/login");
        }, 500);
      }
    } catch (err) {
      const errorResponse = err as { response?: { data?: { detail?: string | { msg?: string }[] } } };
      const detail = errorResponse.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : (Array.isArray(detail) && detail[0]?.msg) || "Registration failed. Please try again."
      );
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingData.name || !onboardingData.shortName) {
      setError("Please fill out all required onboarding fields.");
      return;
    }

    setOnboardingLoading(true);
    setError(null);

    try {
      // Create Society
      await api.post("/societies/create-society", {
        name: onboardingData.name,
        short_name: onboardingData.shortName,
        description: onboardingData.description || null,
        logo_url: onboardingData.logoUrl || null,
      });

      // If initial event name provided, create draft event
      if (onboardingData.initialEventName) {
        try {
          await api.post("/events/", {
            title: onboardingData.initialEventName,
            date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            venue: "To Be Decided",
            slots: 100,
            status: "draft",
          });
        } catch (eventErr) {
          console.warn("Failed to create initial event, ignoring.", eventErr);
        }
      }

      setOnboardingSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/admin");
      }, 300);
    } catch (err) {
      const errorResponse = err as { response?: { data?: { detail?: string } } };
      const detail = errorResponse.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to create society. Try again.");
    } finally {
      setOnboardingLoading(false);
    }
  };

  if (showOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-xl border border-slate-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
              <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Society Setup
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
              Set up your college society workspace to begin coordinating events.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          {onboardingSuccess && (
            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Society onboarding successful! Loading workspace...</span>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleOnboardingSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Society Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={onboardingData.name}
                  onChange={(e) => setOnboardingData({ ...onboardingData, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="e.g. Computer Society of India"
                />
              </div>

              <div>
                <label htmlFor="shortName" className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Short Name / Abbreviation *
                </label>
                <input
                  id="shortName"
                  name="shortName"
                  type="text"
                  required
                  value={onboardingData.shortName}
                  onChange={(e) => setOnboardingData({ ...onboardingData, shortName: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="e.g. CSI"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Society Description
                </label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  value={onboardingData.description}
                  onChange={(e) => setOnboardingData({ ...onboardingData, description: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="Tell students about your society..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Society Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-zinc-800 dark:file:text-zinc-300"
                />
              </div>

              <div>
                <label htmlFor="initialEventName" className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  First Event Name (Optional)
                </label>
                <input
                  id="initialEventName"
                  name="initialEventName"
                  type="text"
                  value={onboardingData.initialEventName}
                  onChange={(e) => setOnboardingData({ ...onboardingData, initialEventName: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="e.g. CodeStorm Hackathon"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={onboardingLoading || onboardingSuccess}
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "flex w-full justify-center py-6 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors"
                )}
              >
                {onboardingLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Complete Onboarding
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-slate-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
            Join EventSphere to register and coordinate campus events.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Registration successful! {formData.role === "society_president" ? "Initializing onboarding..." : "Verification link sent to email."}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Full Name *
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon className="h-5 w-5" />
                </span>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Email Address *
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={!!inviteToken}
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="johndoe@university.edu"
                />
              </div>
            </div>

            <div>
              <label htmlFor="college" className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                College / Institution *
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Building className="h-5 w-5" />
                </span>
                <input
                  id="college"
                  name="college"
                  type="text"
                  required
                  value={formData.college}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="e.g. SCIT College"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Phone Number (Optional)
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-5 w-5" />
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="e.g. 1234567890"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Purpose / Onboarding Role *
              </label>
              <select
                id="role"
                name="role"
                disabled={!!inviteToken}
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="student">Participant / Student</option>
                <option value="society_president">Society Admin / Organizer</option>
                {inviteToken && (
                  <>
                    <option value="judge">Judge</option>
                    <option value="volunteer">Volunteer</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="referralCode" className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Referral Code (Optional)
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <LinkIcon className="h-5 w-5" />
                </span>
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  value={formData.referralCode}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="e.g. IEEE-ABCD"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Password *
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Confirm Password *
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="Re-enter password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-slate-900 dark:text-zinc-300">
              Remember Me
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || success}
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "flex w-full justify-center py-6 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors"
              )}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Register Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-slate-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
