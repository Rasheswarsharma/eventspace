"use client";

import React, { useEffect, useState, use } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/services/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar, MapPin, Clock, Award, Shield, Users, HelpCircle,
  ArrowLeft, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EventDetail {
  id: string;
  name: string;
  description: string;
  date: string;
  venue: string;
  banner_url?: string;
  cover_banner_url?: string;
  status: string;
  registration_deadline?: string;
  registration_capacity?: number;
  rules?: string[];
  schedule?: { time: string; activity: string }[];
  speakers?: { name: string; designation: string; image_url?: string }[];
  prizes?: { position: string; reward: string }[];
  sponsors?: { name: string; logo_url?: string; website?: string }[];
  gallery_urls?: string[];
  faqs?: { question: string; answer: string }[];
  registration_form_schema?: any[];
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const { user } = useAuthStore();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Default Mock data for premium experience fallback
  const mockEvent: EventDetail = {
    id: eventId,
    name: "AI Odyssey Hackathon 2026",
    description: "Welcome to AI Odyssey! A premier 36-hour sprint where student designers, developers, and AI researchers gather to solve grand challenges in education, healthcare, and green tech. Expand your horizons, receive elite mentoring, and pitch to leading tech VCs.",
    date: "2026-11-12T09:00:00Z",
    venue: "Main Auditorium & Innovation Lab",
    banner_url: "",
    cover_banner_url: "",
    status: "registration_open",
    registration_deadline: "2026-11-10T18:00:00Z",
    registration_capacity: 250,
    rules: [
      "Teams of 2 to 4 participants are allowed.",
      "Projects must be built entirely during the hackathon timeline.",
      "Submissions must include a running demo link and GitHub repository url.",
      "Plagiarism or usage of pre-built full templates will result in instant disqualification."
    ],
    schedule: [
      { time: "09:00 AM", activity: "Check-in & Breakfast" },
      { time: "10:00 AM", activity: "Opening Ceremony & Keynote Speech" },
      { time: "11:30 AM", activity: "Coding Commences & API Workshops" },
      { time: "05:00 PM", activity: "Mentorship Round 1 (Architecture check)" },
      { time: "09:00 PM", activity: "Dinner & Midnight Fun Activities" }
    ],
    speakers: [
      { name: "Dr. Aravind Roy", designation: "AI Scientist, DeepMind", image_url: "" },
      { name: "Lisa Thompson", designation: "Product Lead, Google Cloud AI", image_url: "" }
    ],
    prizes: [
      { position: "1st Place (Winner)", reward: "₹1,50,000 Cash + Cloud Credits + Apple iPads" },
      { position: "2nd Place (Runner Up)", reward: "₹80,000 Cash + Cloud Credits" },
      { position: "Best Innovative Use of LLMs", reward: "₹30,000 Cash + Special Swags" }
    ],
    sponsors: [
      { name: "Google Cloud", website: "https://cloud.google.com" },
      { name: "FastAPI Corp", website: "https://fastapi.tiangolo.com" }
    ],
    gallery_urls: [
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c"
    ],
    faqs: [
      { question: "Who is eligible to participate?", answer: "Any active college student or researcher with a valid institutional email is welcome." },
      { question: "Is there a registration fee?", answer: "No, AI Odyssey is completely free of charge. Travel reimbursement will be provided to shortlisted outstation teams." },
      { question: "What should I bring?", answer: "Your laptop, chargers, valid college ID card, and a passion for coding!" }
    ],
    registration_form_schema: [
      { name: "roll_number", label: "Roll Number / Student ID", type: "text", required: true, placeholder: "e.g. 2023CS101" },
      { name: "github_profile", label: "GitHub Profile Link", type: "github_url", required: true, placeholder: "https://github.com/username" },
      { name: "linkedin_profile", label: "LinkedIn Profile Link", type: "linkedin_url", required: false, placeholder: "https://linkedin.com/in/username" },
      { name: "tshirt_size", label: "T-Shirt Size", type: "dropdown", required: true, options: ["S", "M", "L", "XL", "XXL"] }
    ]
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const res = await api.get(`/events/${eventId}`);
        if (res.data) {
          setEvent(res.data);
        } else {
          setEvent(mockEvent);
        }
      } catch (err) {
        setEvent(mockEvent);
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
  }, [eventId]);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    // Validate core fields
    const coreName = formData["name"] || user?.full_name || "";
    const coreEmail = formData["email"] || user?.email || "";
    const corePhone = formData["phone"] || user?.phone || "";

    if (!coreName || !coreEmail || !corePhone) {
      setMessage({ type: "error", text: "Please enter your Name, Email, and Phone Number." });
      setSubmitting(false);
      return;
    }

    // Filter out core fields
    const customData: Record<string, any> = {};
    Object.keys(formData).forEach((key) => {
      if (key !== "name" && key !== "email" && key !== "phone") {
        customData[key] = formData[key];
      }
    });

    try {
      await api.post(`/events/${eventId}/register`, {
        name: coreName,
        email: coreEmail,
        phone: corePhone,
        custom_fields_data: customData
      });
      setMessage({ type: "success", text: "Registration Successful! An email verification/confirmation has been sent." });
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Registration failed. You might already be registered.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-slate-500 dark:text-zinc-400 text-sm">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
        <h3 className="text-lg font-bold">Event Not Found</h3>
        <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">This event doesn't exist or was removed.</p>
        <Link href="/events" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
          Back to Events
        </Link>
      </div>
    );
  }

  const defaultBannerGradient = "from-indigo-600 via-purple-600 to-pink-500";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans pb-16">
      
      {/* Banner / Cover Banner Section */}
      <div className="relative h-[300px] md:h-[450px] w-full overflow-hidden">
        {event.cover_banner_url ? (
          <img
            src={event.cover_banner_url}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn("w-full h-full bg-gradient-to-r flex items-center justify-center relative", defaultBannerGradient)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            <div className="relative text-center px-4 max-w-4xl space-y-3 z-10 text-white">
              <span className="text-xs uppercase tracking-widest font-black bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                {event.status.replace("_", " ")}
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                {event.name}
              </h1>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8">
        <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline mb-6 cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
          Back to all events
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Column (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 space-y-6 shadow-sm">
              <h2 className="text-2xl font-black border-b border-slate-100 dark:border-zinc-800 pb-3">About the Event</h2>
              <p className="text-slate-700 dark:text-zinc-300 leading-relaxed text-sm md:text-base whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Rules */}
            {event.rules && event.rules.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 space-y-6 shadow-sm">
                <h2 className="text-2xl font-black border-b border-slate-100 dark:border-zinc-800 pb-3">Event Rules</h2>
                <ul className="space-y-3">
                  {event.rules.map((rule, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-sm text-slate-700 dark:text-zinc-300">
                      <Shield className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Schedule */}
            {event.schedule && event.schedule.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 space-y-6 shadow-sm">
                <h2 className="text-2xl font-black border-b border-slate-100 dark:border-zinc-800 pb-3">Event Schedule</h2>
                <div className="relative border-l border-slate-200 dark:border-zinc-800 pl-6 ml-3 space-y-6">
                  {event.schedule.map((item, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-55 dark:ring-indigo-950" />
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/10 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/50 w-fit">
                          {item.time}
                        </span>
                        <p className="font-bold text-sm text-slate-900 dark:text-white flex-1 sm:pl-4">
                          {item.activity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speakers / Judges */}
            {event.speakers && event.speakers.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 space-y-6 shadow-sm">
                <h2 className="text-2xl font-black border-b border-slate-100 dark:border-zinc-800 pb-3">Speakers & Judges</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.speakers.map((sp, idx) => (
                    <div key={idx} className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center">
                        <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{sp.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">{sp.designation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prizes */}
            {event.prizes && event.prizes.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 space-y-6 shadow-sm">
                <h2 className="text-2xl font-black border-b border-slate-100 dark:border-zinc-800 pb-3">Prizes & Rewards</h2>
                <div className="space-y-4">
                  {event.prizes.map((pz, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-xl bg-gradient-to-tr from-amber-500/5 to-yellow-500/5 border border-amber-500/20">
                      <Award className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400">{pz.position}</h4>
                        <p className="text-xs text-slate-600 dark:text-zinc-300 font-semibold">{pz.reward}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {event.gallery_urls && event.gallery_urls.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 space-y-6 shadow-sm">
                <h2 className="text-2xl font-black border-b border-slate-100 dark:border-zinc-800 pb-3">Gallery</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {event.gallery_urls.map((url, idx) => (
                    <div key={idx} className="h-40 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800">
                      <img src={url} alt="Gallery image" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {event.faqs && event.faqs.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 space-y-6 shadow-sm">
                <h2 className="text-2xl font-black border-b border-slate-100 dark:border-zinc-800 pb-3">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {event.faqs.map((faq, idx) => (
                    <div key={idx} className="space-y-1">
                      <h4 className="font-bold text-sm flex gap-1.5 items-start">
                        <Users className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{faq.question}</span>
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 pl-6 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Registration Sidebar Panel */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-6 sticky top-24">
              <h3 className="text-lg font-black border-b border-slate-100 dark:border-zinc-800 pb-2">Event Registration</h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-indigo-500" /> Date
                  </span>
                  <span className="font-bold text-xs">{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-500" /> Deadline
                  </span>
                  <span className="font-bold text-xs">
                    {event.registration_deadline
                      ? new Date(event.registration_deadline).toLocaleString()
                      : "Open until start"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-indigo-500" /> Venue
                  </span>
                  <span className="font-bold text-xs max-w-[150px] truncate">{event.venue}</span>
                </div>
              </div>

              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl cursor-pointer text-center text-sm shadow-md transition-colors"
                >
                  Register Now
                </button>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-400">Fill Registration Form</h4>
                  
                  {message && (
                    <div className={cn(
                      "p-3 rounded-lg text-xs font-semibold flex items-center gap-2",
                      message.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40" : "bg-red-50 text-red-700 dark:bg-red-950/40"
                    )}>
                      {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                      <span>{message.text}</span>
                    </div>
                  )}

                  {/* Core Fields */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        defaultValue={user?.full_name || ""}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                        placeholder="e.g. Aman Gupta"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        defaultValue={user?.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                        placeholder="e.g. aman@college.edu"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        defaultValue={user?.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                        placeholder="10-digit number"
                      />
                    </div>

                    {/* Dynamic Fields from Organizer Builder */}
                    {event.registration_form_schema && event.registration_form_schema.map((field) => {
                      const fieldName = field.name;
                      const isRequired = field.required;
                      const placeholder = field.placeholder || "";
                      const label = field.label || fieldName;

                      if (field.type === "dropdown") {
                        return (
                          <div key={fieldName}>
                            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                              {label} {isRequired && <span className="text-red-500">*</span>}
                            </label>
                            <select
                              required={isRequired}
                              onChange={(e) => handleInputChange(fieldName, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                            >
                              <option value="">Select option</option>
                              {field.options && field.options.map((opt: string) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      return (
                        <div key={fieldName}>
                          <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            {label} {isRequired && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type={field.type === "number" ? "number" : "text"}
                            required={isRequired}
                            placeholder={placeholder}
                            onChange={(e) => handleInputChange(fieldName, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="w-1/2 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 font-bold py-2 rounded-lg cursor-pointer text-center text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg cursor-pointer text-center text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
