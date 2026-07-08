"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/services/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Layers, Search, Plus, Bell, MessageSquare, Sun, Moon, LogOut,
  Calendar as CalendarIcon, Users, Award, Shield, CheckSquare, Sparkles,
  MapPin, Clock, Send, ChevronRight, Code2, Layout,
  Compass, HelpCircle, BookOpen, Settings, BarChart2, DollarSign, Image,
  Volume2, ShieldAlert, CheckCircle2, XCircle, FileSpreadsheet, Loader2,
  Camera, Zap
} from "lucide-react";

// Types for local state
interface MockMessage {
  id: string;
  sender: string;
  role: string;
  text: string;
  time: string;
}

interface MockTask {
  id: string;
  title: string;
  status: "pending" | "completed";
  assignedTo: string;
}

interface MockEvent {
  id: string;
  title: string;
  date: string;
  registered: number;
  volunteers: number;
  venue: string;
  status: "Running" | "Upcoming" | "Deadline";
}

interface NotificationItem {
  id: string;
  text: string;
  time: string;
  read: boolean;
}

export function DashboardContainer({ defaultRole }: { defaultRole?: string }) {
  const router = useRouter();
  const { user, clearAuth, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const notificationsRef = React.useRef<HTMLDivElement>(null);
  const quickAddRef = React.useRef<HTMLDivElement>(null);

  // Simulation controls
  const [currentRole, setCurrentRole] = useState<string>(defaultRole || user?.role || "student");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // UI Interactive States
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  // Interactive Panel States
  const [activeChatChannel, setActiveChatChannel] = useState("general");
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Record<string, MockMessage[]>>({
    general: [
      { id: "1", sender: "Rohan Das", role: "Society Admin", text: "Hey team, welcome to the EventSphere hub!", time: "10:15 AM" },
      { id: "2", sender: "Priya Sharma", role: "Volunteer", text: "Excited to coordinate Diwali Fest tomorrow!", time: "10:20 AM" },
    ],
    web: [
      { id: "1", sender: "Aman Gupta", role: "Super Admin", text: "Frontend compilation checks out. Repositories linked.", time: "Yesterday" },
    ],
    ai: [
      { id: "1", sender: "Sneha Sen", role: "Judge", text: "Has the judicial rubric for evaluating Diwali hackathon been finalized?", time: "2 hours ago" },
    ],
    marketing: [],
    design: [],
    core: []
  });

  const [tasks, setTasks] = useState<MockTask[]>([
    { id: "1", title: "Set up registration desks", status: "completed", assignedTo: "Priya Sharma" },
    { id: "2", title: "Print QR check-in badges", status: "pending", assignedTo: "Rahul Verma" },
    { id: "3", title: "Test stage audio system", status: "pending", assignedTo: "Priya Sharma" },
    { id: "4", title: "Welcome guest speakers", status: "pending", assignedTo: "Simran Kaur" }
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [events, setEvents] = useState<MockEvent[]>([
    { id: "1", title: "Diwali Fest 2026", date: "Tomorrow", registered: 300, volunteers: 25, venue: "Auditorium", status: "Upcoming" },
    { id: "2", title: "AI Hackathon", date: "Running", registered: 120, volunteers: 10, venue: "Lab 3", status: "Running" },
    { id: "3", title: "Web Design Workshop", date: "July 15", registered: 80, volunteers: 5, venue: "Seminar Hall", status: "Upcoming" },
    { id: "4", title: "IoT Innovation Expo", date: "July 20", registered: 450, volunteers: 40, venue: "Main Ground", status: "Deadline" }
  ]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: "1", text: "Registration Approved: Diwali Fest 2026", time: "5 mins ago", read: false },
    { id: "2", text: "Volunteer Assigned: Priya Sharma to desk coordination", time: "1 hour ago", read: false },
    { id: "3", text: "Certificate Generated for Aman Gupta", time: "4 hours ago", read: true },
    { id: "4", text: "Budget Approved: ₹45,000 for Sound equipment", time: "Yesterday", read: true },
    { id: "5", text: "Attendance Excel sheet uploaded successfully", time: "2 days ago", read: true }
  ]);

  // AI assistant simulation
  const [aiPrompts] = useState<string[]>([
    "Generate Event Timeline",
    "Create Budget",
    "Generate Certificate",
    "Volunteer Suggestions",
    "Attendance Insights"
  ]);
  const [aiMessages, setAiMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hello! I am EventSphere AI. How can I assist you in coordinating your society events today?" }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Quick Action Modal states
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showAddVolunteerModal, setShowAddVolunteerModal] = useState(false);
  const [showIssueCertModal, setShowIssueCertModal] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);

  // Custom states for creators
  const [newEvent, setNewEvent] = useState({ title: "", date: "", venue: "", registered: 0, volunteers: 0 });
  const [newVolunteer, setNewVolunteer] = useState({ name: "", phone: "", email: "", role: "volunteer" });
  const [newCert, setNewCert] = useState({ studentName: "", eventName: "", hash: "" });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", tag: "General" });
  const [announcements, setAnnouncements] = useState([
    { id: "1", title: "Diwali Fest Dress Code", content: "Wear traditional ethnic wear tomorrow!", date: "Today", tag: "Fests" },
    { id: "2", title: "AI Rubric Published", content: "Check the judicial evaluation panel for details.", date: "Yesterday", tag: "Academic" }
  ]);

  // QR Scanning Simulation
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Certificates download mockup
  const [certificateHashSearch, setCertificateHashSearch] = useState("");
  interface CertificateLookupResult {
    status: string;
    hash?: string;
    recipient?: string;
    event?: string;
    role?: string;
    date?: string;
    error?: string;
    institution?: string;
  }
  const [lookupResult, setLookupResult] = useState<CertificateLookupResult | null>(null);

  // Budget states
  const [budgetItems] = useState([
    { id: "1", category: "Decorations", allocated: 50000, spent: 45000, status: "Approved" },
    { id: "2", category: "Sound & AV", allocated: 30000, spent: 30000, status: "Approved" },
    { id: "3", category: "Prizes & Medals", allocated: 100000, spent: 85000, status: "Approved" },
    { id: "4", category: "Catering", allocated: 50000, spent: 48000, status: "Pending" }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    // Recover user auth and sync simulated role
    const syncUser = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data) {
          setAuth(res.data, useAuthStore.getState().accessToken || "");
          if (!defaultRole) {
            setCurrentRole(res.data.role);
          }
        }
      } catch {
        // Fallback to local storage or guest demo mode
        console.log("No active JWT session. Using mockup mode.");
      }
    };
    syncUser();
    return () => clearTimeout(timer);
  }, [setAuth, defaultRole]);

  // Dark Mode toggling helper
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Click outside handler to close dropdown panels (quick add, notifications)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setShowQuickAdd(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  // Chat message submission
  const sendMessage = () => {
    if (!chatMessage.trim()) return;
    const msg: MockMessage = {
      id: Date.now().toString(),
      sender: user?.full_name || "Testing User",
      role: currentRole.toUpperCase().replace("_", " "),
      text: chatMessage,
      time: "Just Now"
    };
    setChatHistory((prev) => ({
      ...prev,
      [activeChatChannel]: [...prev[activeChatChannel], msg]
    }));
    setChatMessage("");
  };

  // AI assistant logic
  const handleAiPromptClick = async (prompt: string) => {
    setAiMessages((prev) => [...prev, { sender: "user", text: prompt }]);
    setAiLoading(true);

    setTimeout(() => {
      let aiResponse = "";
      switch (prompt) {
        case "Generate Event Timeline":
          aiResponse = "Here is the recommended schedule for Diwali Fest:\n- 09:00 AM: Registration Open\n- 10:00 AM: Inaugural Ceremony\n- 11:30 AM: Cultural Showcases\n- 01:30 PM: Lunch Break\n- 03:00 PM: Award ceremony.";
          break;
        case "Create Budget":
          aiResponse = "Estimated allocation recommendation:\n- Venue & Sound: ₹50,000\n- Catering: ₹40,000\n- Marketing & Merchandise: ₹20,000\n- Miscellaneous: ₹10,000.";
          break;
        case "Generate Certificate":
          aiResponse = "Created certificate template. Format details: Landscape layout, Gold seal border, Cryptographic Lookup Hash: ESP-891-FX12. Ready to dispatch.";
          break;
        case "Volunteer Suggestions":
          aiResponse = "Based on previous check-in ratings:\n- Priya Sharma is highly rated for desk check-ins.\n- Rahul Verma has completed 4 logistics tasks.\n- Assign Simran Kaur to guest relations.";
          break;
        case "Attendance Insights":
          aiResponse = "Diwali Fest registration to attendance ratio is forecasted at 94%. Peak scan check-in activity is expected tomorrow between 08:30 AM and 09:15 AM.";
          break;
        default:
          aiResponse = "I can definitely look that up for you. Can you specify the event name?";
      }
      setAiMessages((prev) => [...prev, { sender: "ai", text: aiResponse }]);
      setAiLoading(false);
    }, 1000);
  };

  const handleAiInputSend = () => {
    if (!aiInput.trim()) return;
    const text = aiInput;
    setAiMessages((prev) => [...prev, { sender: "user", text }]);
    setAiInput("");
    setAiLoading(true);

    setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        { sender: "ai", text: `Understood! I will analyze the metrics for "${text}" and generate insights in your Reports panel.` }
      ]);
      setAiLoading(false);
    }, 1200);
  };

  // Quick Action triggers
  const executeCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.venue) return;
    const added: MockEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: newEvent.date || "Next Week",
      registered: newEvent.registered || 0,
      volunteers: newEvent.volunteers || 0,
      venue: newEvent.venue,
      status: "Upcoming"
    };
    setEvents([added, ...events]);
    setShowCreateEventModal(false);
    setNewEvent({ title: "", date: "", venue: "", registered: 0, volunteers: 0 });
    // Push a notification
    setNotifications([
      { id: Date.now().toString(), text: `New Event Scheduled: ${added.title}`, time: "Just Now", read: false },
      ...notifications
    ]);
  };

  const executeAddVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolunteer.name) return;
    const addedTask: MockTask = {
      id: Date.now().toString(),
      title: `Assigned duty to ${newVolunteer.name}`,
      status: "pending",
      assignedTo: newVolunteer.name
    };
    setTasks([addedTask, ...tasks]);
    setShowAddVolunteerModal(false);
    setNewVolunteer({ name: "", phone: "", email: "", role: "volunteer" });
  };

  const executeIssueCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.studentName || !newCert.eventName) return;
    const newHash = newCert.hash || "ESP-" + Math.floor(100 + Math.random() * 900) + "-CERT";
    // Add verification lookup mock
    setNotifications([
      { id: Date.now().toString(), text: `Certificate Issued to ${newCert.studentName} (${newCert.eventName}) with hash ${newHash}`, time: "Just Now", read: false },
      ...notifications
    ]);
    setShowIssueCertModal(false);
    setNewCert({ studentName: "", eventName: "", hash: "" });
  };

  const executeAnnounce = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    const added = {
      id: Date.now().toString(),
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      date: "Today",
      tag: newAnnouncement.tag
    };
    setAnnouncements([added, ...announcements]);
    setShowAnnounceModal(false);
    setNewAnnouncement({ title: "", content: "", tag: "General" });
  };

  // QR Check-in scanner mockup
  const startCameraScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult("Verified Check-In: Aman Gupta | Diwali Fest Ticket | ESP-581-V1");
      // Add notification
      setNotifications([
        { id: Date.now().toString(), text: "QR Ticket Scanned: Aman Gupta verified.", time: "Just now", read: false },
        ...notifications
      ]);
    }, 2500);
  };

  // Certificate Lookup mockup
  const handleCertLookup = () => {
    if (!certificateHashSearch.trim()) return;
    if (certificateHashSearch.toLowerCase().includes("esp-891") || certificateHashSearch.toLowerCase().includes("testing")) {
      setLookupResult({
        hash: certificateHashSearch.toUpperCase(),
        recipient: "Aman Gupta",
        event: "Web Development Bootcamp",
        role: "Participant",
        date: "June 25, 2026",
        status: "Verified & Issued",
        institution: "EventSphere College Authority"
      });
    } else {
      setLookupResult({
        hash: certificateHashSearch.toUpperCase(),
        status: "Not Found",
        error: "No matching record located in EventSphere Registry."
      });
    }
  };

  // Toggle tasks check
  const toggleTaskStatus = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t))
    );
  };

  // Add Task inline
  const addTaskInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newT: MockTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      status: "pending",
      assignedTo: "Priya Sharma"
    };
    setTasks([...tasks, newT]);
    setNewTaskTitle("");
  };

  // Mock download files
  const downloadReport = (format: string) => {
    alert(`Downloading dashboard report in ${format.toUpperCase()} format...`);
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A] dark:bg-zinc-950 dark:text-zinc-50 font-sans">

      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 select-none glassy-panel">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-zinc-800 gap-2.5">
          <Layers className="h-6 w-6 text-[#2563EB]" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#2563EB] to-[#14B8A6] bg-clip-text text-transparent">
            EventSphere
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
          {[
            { id: "dashboard", label: "Dashboard", icon: Layout },
            { id: "societies", label: "Societies", icon: Compass },
            { id: "events", label: "Events", icon: CalendarIcon },
            { id: "registrations", label: "Registrations", icon: Users },
            { id: "volunteers", label: "Volunteers", icon: CheckSquare },
            { id: "judges", label: "Judges", icon: Shield },
            { id: "faculty", label: "Faculty Panel", icon: ShieldAlert },
            { id: "attendance", label: "Attendance", icon: Camera },
            { id: "certificates", label: "Certificates", icon: Award },
            { id: "gallery", label: "Gallery", icon: Image },
            { id: "announcements", label: "Announcements", icon: Volume2 },
            { id: "budget", label: "Budget", icon: DollarSign },
            { id: "analytics", label: "Analytics", icon: BarChart2 },
            { id: "reports", label: "Reports", icon: FileSpreadsheet },
            { id: "settings", label: "Settings", icon: Settings },
          ]
            .filter((item) => {
              // Check if tab is allowed for currentRole
              switch (currentRole) {
                case "super_admin":
                  return true;
                case "society_president":
                case "society_admin":
                  return ["dashboard", "events", "registrations", "volunteers", "judges", "attendance", "certificates", "gallery", "announcements", "budget", "analytics", "reports", "settings"].includes(item.id);
                case "volunteer":
                  return ["dashboard", "events", "attendance", "settings"].includes(item.id);
                case "judge":
                  return ["dashboard", "events", "judges", "settings"].includes(item.id);
                case "student":
                default:
                  return ["dashboard", "events", "certificates", "settings"].includes(item.id);
              }
            })
            .map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              
              // Map labels based on role
              let label = item.label;
              if (currentRole === "student") {
                if (item.id === "dashboard") label = "Dashboard Overview";
                if (item.id === "events") label = "My Events";
                if (item.id === "certificates") label = "My Certificates";
                if (item.id === "settings") label = "Profile";
              } else if (currentRole === "volunteer") {
                if (item.id === "events") label = "Assigned Events";
                if (item.id === "settings") label = "Profile";
              } else if (currentRole === "judge") {
                if (item.id === "events") label = "Assigned Events";
                if (item.id === "judges") label = "Score Sheets";
                if (item.id === "settings") label = "Profile";
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    active
                      ? "bg-[#2563EB]/10 text-[#2563EB] dark:bg-indigo-500/20 dark:text-indigo-400"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{label}</span>
                </button>
              );
            })}
        </nav>

        {/* Footer controls inside Sidebar */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 space-y-1">
          <a
            href="#help"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Help</span>
          </a>
          <a
            href="#docs"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>Documentation</span>
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors rounded-lg cursor-pointer text-left"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ==================== MAIN SECTION CONTAINER ==================== */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ==================== TOP NAVIGATION ==================== */}
        <header className="h-16 border-b border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between px-6 z-10 select-none glassy-panel">
          {/* Global Search Bar */}
          <div className="relative w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search Events, Students, Volunteers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchModal(e.target.value.length > 0);
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm placeholder-slate-400 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] dark:border-zinc-800 dark:bg-zinc-950 dark:text-white transition-all"
            />

            {/* Quick Search Modal overlay */}
            {showSearchModal && (
              <div className="absolute top-11 left-0 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Results</h4>
                  <button onClick={() => setShowSearchModal(false)} className="text-xs text-[#2563EB] hover:underline cursor-pointer">Close</button>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {events.filter(ev => ev.title.toLowerCase().includes(searchQuery.toLowerCase())).map(ev => (
                    <div key={ev.id} className="p-2 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer flex justify-between items-center" onClick={() => { setActiveTab("events"); setShowSearchModal(false); }}>
                      <span className="text-sm font-semibold">{ev.title}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded-full">Event</span>
                    </div>
                  ))}
                  {tasks.filter(t => t.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
                    <div key={t.id} className="p-2 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer flex justify-between items-center" onClick={() => { setActiveTab("volunteers"); setShowSearchModal(false); }}>
                      <span className="text-sm font-semibold">{t.assignedTo}</span>
                      <span className="text-[10px] bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 px-1.5 py-0.5 rounded-full">Volunteer</span>
                    </div>
                  ))}
                  {notifications.filter(n => n.text.toLowerCase().includes(searchQuery.toLowerCase())).map(n => (
                    <div key={n.id} className="p-2 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer" onClick={() => setShowSearchModal(false)}>
                      <p className="text-xs font-medium truncate">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions, Notifications, Messages, Theme, Profile */}
          <div className="flex items-center gap-4">

            {/* Quick Actions (+) Button */}
            <div className="relative" ref={quickAddRef}>
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white hover:bg-[#1d4ed8] text-xs font-semibold shadow-sm transition-all cursor-pointer select-none"
              >
                <Plus className="h-4.5 w-4.5" />
                <span className="hidden sm:inline">Quick Add</span>
              </button>
              {showQuickAdd && (
                <div className="absolute right-0 top-9 w-52 rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-50">
                  <button onClick={() => { setShowCreateEventModal(true); setShowQuickAdd(false); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800">Create Event</button>
                  <button onClick={() => { setShowAddVolunteerModal(true); setShowQuickAdd(false); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800">Add Volunteer</button>
                  <button onClick={() => { setShowIssueCertModal(true); setShowQuickAdd(false); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800">Issue Certificate</button>
                  <button onClick={() => { setShowAnnounceModal(true); setShowQuickAdd(false); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800">Create Announcement</button>
                  <button onClick={() => { downloadReport("pdf"); setShowQuickAdd(false); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800">Generate Report</button>
                </div>
              )}
            </div>
 
            {/* Notifications Panel */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  // Mark all read
                  setNotifications(notifications.map(n => ({ ...n, read: true })));
                }}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[#EF4444] border-2 border-white dark:border-zinc-900" />
                )}
              </button>
 
              {showNotifications && (
                <div className="absolute right-0 top-11 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-50">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-zinc-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Notifications</span>
                    <button onClick={() => setNotifications([])} className="text-xs text-red-500 hover:underline cursor-pointer">Clear all</button>
                  </div>
                  <div className="space-y-2.5 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No notifications yet.</p>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className="flex gap-2 text-xs leading-relaxed items-start border-b border-slate-50 dark:border-zinc-800/50 pb-2 last:border-none">
                          <div className="h-2 w-2 mt-1.5 rounded-full bg-[#2563EB]" />
                          <div className="flex-1">
                            <p className="font-semibold text-slate-700 dark:text-zinc-200">{notif.text}</p>
                            <span className="text-[10px] text-slate-400">{notif.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Drawer Toggle */}
            <button
              onClick={() => setShowChatDrawer(!showChatDrawer)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
              title="Team Chat"
            >
              <MessageSquare className="h-5 w-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Profile Menu */}
            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-zinc-800 pl-4">
              <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs cursor-pointer uppercase shadow-sm select-none">
                {user?.full_name?.slice(0, 2) || "AD"}
              </div>
              <div className="hidden lg:block text-left select-none">
                <p className="text-xs font-bold leading-tight">{user?.full_name || "Testing Admin"}</p>
                <p className="text-[10px] font-medium text-slate-400 leading-none capitalize">
                  {currentRole.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ==================== WORKSPACE SCROLL CONTAINER ==================== */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-zinc-950 p-6 space-y-6 scrollbar-thin">

          {/* Dashboard Header Bar with Welcome & Role Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4 select-none">
            <div>
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                {activeTab === "dashboard" ? "Main Workspace" : activeTab.toUpperCase()}
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-[#2563EB] dark:bg-zinc-900 dark:text-indigo-400 uppercase tracking-widest border border-indigo-100 dark:border-zinc-800 animate-pulse">
                  SIMULATION ACTIVE
                </span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Logged in as: <span className="font-semibold text-[#2563EB] dark:text-[#14B8A6]">{user?.email || "testing1234@gmail.com"}</span>
              </p>
            </div>

            {/* Role Simulation Switcher dropdown */}
            {process.env.NODE_ENV !== "production" && (
              <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 p-2 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider pl-1.5">View As Role:</span>
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="bg-slate-50 dark:bg-zinc-950 dark:text-white border border-slate-200 dark:border-zinc-800 text-xs font-semibold rounded-lg px-3 py-1.5 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="society_president">Society Admin / President</option>
                  <option value="event_host">Event Host</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="judge">Judge</option>
                  <option value="faculty">Faculty Advisor</option>
                  <option value="student">Student / Participant</option>
                </select>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* ================== TAB CONTENT DISPATCH ================== */}
          {/* ========================================================= */}

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* 1. Welcome Banner */}
              <div className="relative rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm overflow-hidden select-none">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-indigo-50/50 to-transparent dark:from-indigo-950/20 pointer-events-none" />
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-tr from-[#2563EB] to-[#14B8A6] rounded-xl text-white shadow">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Welcome back, {user?.full_name || "Testing Admin"}!</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mt-0.5">
                      {currentRole === "super_admin" && "You possess global platform permissions. Approve societies, view overall analytics, and audit logs."}
                      {currentRole === "society_admin" && "Manage your society's rosters, repositories, budgets, and issue secure certificates."}
                      {currentRole === "event_host" && "Focus on Diwali Fest registrations, volunteer checklists, and judicial evaluator rubrics."}
                      {currentRole === "volunteer" && "View your assigned schedules, log QR check-in codes, and communicate with the core team."}
                      {currentRole === "judge" && "Access assigned events evaluation guidelines, fill rubric scores, and publish rankings."}
                      {currentRole === "faculty" && "Oversee college society performance budgets, and review pending approval workflows."}
                      {currentRole === "student" && "Browse fests, check-in to events with your ticket QR, and download verified certificates."}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. KPI Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 select-none">
                {[
                  { label: "Events", val: currentRole === "student" ? "3" : "32", icon: CalendarIcon, color: "text-blue-500 bg-blue-500/10" },
                  { label: "Students", val: currentRole === "student" ? "1,356" : "1,356", icon: Users, color: "text-indigo-500 bg-indigo-500/10" },
                  { label: "Certificates", val: currentRole === "student" ? "1" : "891", icon: Award, color: "text-teal-500 bg-teal-500/10" },
                  { label: "Attendance", val: currentRole === "student" ? "100%" : "94%", icon: CheckCircle2, color: "text-green-500 bg-green-500/10" },
                  { label: "Budget Used", val: currentRole === "student" ? "₹0" : "₹2.3L", icon: DollarSign, color: "text-amber-500 bg-amber-500/10" },
                  { label: "Repositories", val: currentRole === "student" ? "2" : "27", icon: Code2, color: "text-slate-500 bg-slate-500/10" },
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col justify-between h-28 card-lift">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                        <div className={cn("p-1.5 rounded-lg", kpi.color)}>
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <p className="text-2xl font-black tracking-tight">{kpi.val}</p>
                    </div>
                  );
                })}
              </div>

              {/* 3. Upcoming Events & Calendar Grid */}
              <div className="grid lg:grid-cols-3 gap-6">

                {/* Event Calendar Widget */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-zinc-800 pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" /> Event Calendar
                    </h3>
                    <div className="flex gap-4 text-xs font-bold">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-green-500 rounded-full" /> Running</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-blue-500 rounded-full" /> Upcoming</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-red-500 rounded-full" /> Deadline</span>
                    </div>
                  </div>

                  {/* Calendar Grid mockup */}
                  <div className="grid grid-cols-7 gap-2 text-center text-xs">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                      <div key={day} className="font-bold text-slate-400 py-1">{day}</div>
                    ))}
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = i + 1;
                      const classNames = "p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 font-semibold relative";
                      let indicator = null;
                      if (day === 7) indicator = "bg-green-500"; // AI Hackathon
                      if (day === 8) indicator = "bg-blue-500"; // Diwali Fest
                      if (day === 15) indicator = "bg-blue-500"; // Web workshop
                      if (day === 20) indicator = "bg-red-500"; // IoT Expo

                      return (
                        <div key={day} className={classNames}>
                          <span>{day}</span>
                          {indicator && (
                            <span className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full", indicator)} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Upcoming Events Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 dark:border-zinc-800 pb-2">
                      Upcoming Highlight
                    </h3>
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2.5 py-0.5 rounded-full">
                          Diwali Fest 2026
                        </span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Tomorrow
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-500">Registered:</span>
                          <span className="font-bold">300 Students</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-500">Volunteers:</span>
                          <span className="font-bold">25 Assigned</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-2">
                          <MapPin className="h-4.5 w-4.5 text-indigo-500" />
                          <span>Main Campus Auditorium</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (currentRole === "student") {
                        alert("Registered successfully!");
                      } else {
                        setActiveTab("events");
                      }
                    }}
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }),
                      "w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white py-2 px-4 rounded-lg font-semibold text-xs mt-4 cursor-pointer"
                    )}
                  >
                    {currentRole === "student" ? "Register Now" : "Manage Registrations"}
                  </button>
                </div>
              </div>

              {/* 4. Repository Panel & Team Chat */}
              <div className="grid lg:grid-cols-2 gap-6">

                {/* Repository Hub Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Code2 className="h-4 w-4" /> Repository Hub ⭐
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 dark:bg-zinc-800 rounded">Unique Feature</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {["Web Team", "AI Team", "App Team", "IoT Team", "Research Team", "Design Team"].map((team, idx) => (
                      <div key={idx} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-950/50 space-y-2 flex flex-col justify-between">
                        <span className="text-xs font-bold">{team}</span>
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-0.5"><Code2 className="h-3 w-3" /> GitHub</a>
                          <a href="https://figma.com" target="_blank" rel="noreferrer" className="text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-0.5"><Layers className="h-3 w-3" /> Figma</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Chat Preview */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col justify-between h-[300px]">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2 mb-2">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Society Team Chat ⭐
                      </h3>
                      <div className="flex gap-2">
                        {["general", "web", "ai"].map(ch => (
                          <button
                            key={ch}
                            onClick={() => setActiveChatChannel(ch)}
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                              activeChatChannel === ch
                                ? "bg-indigo-50 text-indigo-600 dark:bg-zinc-800 dark:text-indigo-400"
                                : "text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                            )}
                          >
                            #{ch}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 h-[180px] overflow-y-auto px-1 scrollbar-thin">
                      {chatHistory[activeChatChannel].length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-10">No messages in #{activeChatChannel} yet. Say something!</p>
                      ) : (
                        chatHistory[activeChatChannel].map(msg => (
                          <div key={msg.id} className="text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-700 dark:text-zinc-200">{msg.sender}</span>
                              <span className="text-[9px] bg-slate-100 text-slate-500 dark:bg-zinc-800 px-1 py-0.2 rounded font-medium">{msg.role}</span>
                              <span className="text-[9px] text-slate-400 ml-auto">{msg.time}</span>
                            </div>
                            <p className="text-slate-600 dark:text-zinc-300 mt-0.5">{msg.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-slate-100 dark:border-zinc-800 pt-3 mt-2">
                    <input
                      type="text"
                      placeholder={`Send a message to #${activeChatChannel}...`}
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1 bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#2563EB]"
                    />
                    <button
                      onClick={sendMessage}
                      className="p-1.5 rounded-lg bg-[#2563EB] text-white hover:bg-[#1d4ed8] cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ================== SOCIETIES TAB ================== */}
          {activeTab === "societies" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold">Active Campus Societies</h3>
                  <p className="text-xs text-slate-400">Directory of approved technical and cultural university bodies.</p>
                </div>
                {currentRole === "super_admin" && (
                  <button className="px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors">
                    + Register Society
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { name: "Computer Society (ACM)", lead: "Aman Gupta", eventsCount: 12, budgetAllocated: "₹1,50,000", logo: Compass },
                  { name: "Robotics & IoT Club", lead: "Rohan Sen", eventsCount: 8, budgetAllocated: "₹80,000", logo: Zap },
                  { name: "Cultural Arts Guild", lead: "Sneha Roy", eventsCount: 15, budgetAllocated: "₹2,00,000", logo: Image },
                ].map((soc, i) => {
                  const Logo = soc.logo;
                  return (
                    <div key={i} className="border border-slate-200 rounded-2xl p-5 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 text-[#2563EB] rounded-lg">
                          <Logo className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{soc.name}</h4>
                          <span className="text-[10px] text-slate-400">Lead: {soc.lead}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-100 dark:border-zinc-800/80 py-3">
                        <div>
                          <p className="text-slate-400 font-semibold">Events Hosted</p>
                          <p className="font-bold text-sm mt-0.5">{soc.eventsCount}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Budget Assigned</p>
                          <p className="font-bold text-sm mt-0.5">{soc.budgetAllocated}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <button className="text-[#2563EB] hover:underline font-semibold flex items-center gap-0.5">View Roster <ChevronRight className="h-3.5 w-3.5" /></button>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">Active Tenant</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================== EVENTS TAB ================== */}
          {activeTab === "events" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold">All Event Listings</h3>
                  <p className="text-xs text-slate-400">Verify schedules, forms, modules, and track details.</p>
                </div>
                {["super_admin", "society_admin"].includes(currentRole) && (
                  <button onClick={() => setShowCreateEventModal(true)} className="px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors cursor-pointer">
                    + Create Event
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {events.map(ev => (
                  <div key={ev.id} className="border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{ev.title}</span>
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          ev.status === "Running" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" :
                            ev.status === "Upcoming" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                              "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        )}>
                          {ev.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> {ev.date}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {ev.venue}</span>
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {ev.registered} Registered</span>
                        <span className="flex items-center gap-1"><CheckSquare className="h-3.5 w-3.5" /> {ev.volunteers} Volunteers</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold rounded-lg transition-colors">
                        Edit Forms
                      </button>
                      <button className="px-3 py-1.5 bg-[#2563EB] text-white hover:bg-blue-600 text-xs font-semibold rounded-lg transition-colors">
                        Configure Modules
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================== REGISTRATIONS TAB ================== */}
          {activeTab === "registrations" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold">Registration Roster</h3>
                  <p className="text-xs text-slate-400">View real-time participant registration requests.</p>
                </div>
              </div>

              {/* Registration Statistics Chart (CSS bars) */}
              <div className="p-5 border border-slate-100 dark:border-zinc-800 rounded-2xl space-y-4 bg-slate-50/50 dark:bg-zinc-950/20">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registration Growth Insights</h4>
                <div className="flex items-end justify-between h-48 pt-6 select-none">
                  {[
                    { label: "Mon", height: "h-[40%]", val: "120" },
                    { label: "Tue", height: "h-[65%]", val: "210" },
                    { label: "Wed", height: "h-[50%]", val: "180" },
                    { label: "Thu", height: "h-[85%]", val: "320" },
                    { label: "Fri", height: "h-[95%]", val: "450" },
                    { label: "Sat", height: "h-[70%]", val: "300" },
                    { label: "Sun", height: "h-[80%]", val: "360" }
                  ].map((bar, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1 space-y-2">
                      <div className="text-[10px] font-bold text-[#2563EB]">{bar.val}</div>
                      <div className={cn("w-6 sm:w-10 bg-gradient-to-t from-[#2563EB] to-[#14B8A6] rounded-t-lg transition-all hover:opacity-85", bar.height)} />
                      <span className="text-[10px] text-slate-400 font-semibold">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 dark:border-zinc-800 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 text-slate-400 uppercase font-black tracking-wider">
                      <th className="p-4">Student</th>
                      <th className="p-4">Event</th>
                      <th className="p-4">Form Custom Fields</th>
                      <th className="p-4">Check-In QR</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Rahul Verma", email: "rahul@uni.edu", event: "AI Hackathon", fields: "Resume: Link, Track: ML", qr: "ESP-512-R", status: "Approved" },
                      { name: "Aman Gupta", email: "aman@uni.edu", event: "Diwali Fest", fields: "Food: Veg, Gear: No", qr: "ESP-581-V", status: "Approved" },
                      { name: "Sneha Roy", email: "sneha@uni.edu", event: "Web Workshop", fields: "Familiarity: Basic", qr: "ESP-901-W", status: "Pending" }
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                        <td className="p-4">
                          <p className="font-bold">{row.name}</p>
                          <span className="text-slate-400">{row.email}</span>
                        </td>
                        <td className="p-4 font-semibold">{row.event}</td>
                        <td className="p-4 text-slate-500">{row.fields}</td>
                        <td className="p-4 font-mono text-[10px]">{row.qr}</td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded font-bold uppercase text-[9px]",
                            row.status === "Approved" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          )}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================== VOLUNTEERS TAB ================== */}
          {activeTab === "volunteers" && (
            <div className="grid lg:grid-cols-3 gap-6">

              {/* Task board */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold">Operational Tasks</h3>
                    <p className="text-xs text-slate-400">Track and allocate tasks to operational volunteers.</p>
                  </div>
                  <button onClick={() => setShowAddVolunteerModal(true)} className="px-3 py-1.5 bg-[#2563EB] text-white hover:bg-blue-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                    + Assign Duty
                  </button>
                </div>

                <form onSubmit={addTaskInline} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a new task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
                  />
                  <button type="submit" className="px-4 py-2 bg-[#2563EB] text-white hover:bg-blue-600 rounded-lg text-xs font-semibold cursor-pointer">
                    Add
                  </button>
                </form>

                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-slate-100 dark:border-zinc-800 rounded-xl hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.status === "completed"}
                          onChange={() => toggleTaskStatus(task.id)}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className={cn("text-xs font-semibold", task.status === "completed" && "line-through text-slate-400")}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        Assigned: {task.assignedTo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roster & Metrics */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6 select-none">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-zinc-800">
                    Volunteer Performance
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    { name: "Priya Sharma", completed: 8, pending: 2, attendance: "100%", rating: "⭐⭐⭐⭐⭐" },
                    { name: "Rahul Verma", completed: 4, pending: 4, attendance: "90%", rating: "⭐⭐⭐⭐" },
                    { name: "Simran Kaur", completed: 6, pending: 0, attendance: "100%", rating: "⭐⭐⭐⭐⭐" }
                  ].map((v, idx) => (
                    <div key={idx} className="p-3 border border-slate-100 dark:border-zinc-800 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">{v.name}</span>
                        <span className="text-[10px] text-indigo-500 font-bold">{v.rating}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 font-semibold border-t border-slate-100 dark:border-zinc-800/80 pt-2">
                        <div>Done: <span className="font-bold text-slate-900 dark:text-white">{v.completed}</span></div>
                        <div>Left: <span className="font-bold text-slate-900 dark:text-white">{v.pending}</span></div>
                        <div>Att: <span className="font-bold text-green-600">{v.attendance}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ================== JUDGES TAB ================== */}
          {activeTab === "judges" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold">Judicial Evaluation Hub</h3>
                  <p className="text-xs text-slate-400">Score criteria rubrics and view aggregated live leaderboard rankings.</p>
                </div>
              </div>

              {/* Rubric Evaluator Mockup */}
              <div className="grid lg:grid-cols-3 gap-6">

                {/* Scoring input */}
                <div className="lg:col-span-2 border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-zinc-950/20 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2">Active Team Submission Score Sheet</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Select Contestant Team</label>
                      <select className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-semibold outline-none">
                        <option>Team Webcraft (ID: 01)</option>
                        <option>Team NeuralNet (ID: 02)</option>
                        <option>Team IoT-Sense (ID: 03)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Criteria 1: Code Correctness (1-10)</label>
                      <input type="number" min="1" max="10" defaultValue="8" className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-semibold outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Criteria 2: UI Aesthetics (1-10)</label>
                      <input type="number" min="1" max="10" defaultValue="9" className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-semibold outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Criteria 3: Innovation (1-10)</label>
                      <input type="number" min="1" max="10" defaultValue="7" className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-semibold outline-none" />
                    </div>
                  </div>

                  <button onClick={() => alert("Scoring saved! Leaderboard updated.")} className="px-4 py-2 bg-[#2563EB] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer">
                    Submit Score Card
                  </button>
                </div>

                {/* Leaderboard */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 bg-white dark:bg-zinc-900 space-y-4 select-none">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2">Live Rankings Leaderboard</h4>

                  <div className="space-y-3">
                    {[
                      { rank: "1st", team: "Team NeuralNet", score: "28.5 / 30", color: "border-amber-400 bg-amber-50/20 text-amber-700 dark:text-amber-400" },
                      { rank: "2nd", team: "Team Webcraft", score: "26.0 / 30", color: "border-slate-300 bg-slate-50/20 text-slate-600 dark:text-slate-300" },
                      { rank: "3rd", team: "Team IoT-Sense", score: "24.5 / 30", color: "border-orange-200 bg-orange-50/20 text-orange-700 dark:text-orange-300" }
                    ].map((entry, idx) => (
                      <div key={idx} className={cn("p-3 border rounded-xl flex items-center justify-between", entry.color)}>
                        <span className="font-black text-sm">{entry.rank}</span>
                        <span className="text-xs font-bold">{entry.team}</span>
                        <span className="text-xs font-mono font-black">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ================== FACULTY PANEL TAB ================== */}
          {activeTab === "faculty" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold">Faculty Advisory Board</h3>
                  <p className="text-xs text-slate-400">Review, approve, or reject society budgets, event proposals, and certificates.</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { request: "Allocate ₹1,50,000 for Annual TechFest sound & catering", requester: "ACM Computer Society", type: "Budget Approval", date: "July 05, 2026" },
                  { request: "Approve launch of 'RoboWars 2026' event blueprint", requester: "Robotics Club", type: "Event Proposal", date: "July 06, 2026" }
                ].map((req, i) => (
                  <div key={i} className="p-4 border border-slate-100 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase tracking-wider">{req.type}</span>
                        <span className="text-[10px] text-slate-400">{req.date}</span>
                      </div>
                      <p className="text-sm font-semibold">{req.request}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Submitted by: {req.requester}</p>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => alert("Approved successfully")} className="px-3 py-1.5 bg-[#22C55E] hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Approve</button>
                      <button onClick={() => alert("Rejected request")} className="px-3 py-1.5 bg-[#EF4444] hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"><XCircle className="h-4 w-4" /> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================== ATTENDANCE TAB ================== */}
          {activeTab === "attendance" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold">Attendance & Ticket Check-In</h3>
                  <p className="text-xs text-slate-400">Scan student tickets via QR code checker to record duplicate-proof attendance.</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">

                {/* Camera simulation */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-zinc-950/20 space-y-4 flex flex-col items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider self-start">Camera Ticket Scanner</h4>

                  <div className="w-full max-w-sm aspect-video rounded-xl bg-slate-900 border-4 border-slate-800 flex flex-col items-center justify-center text-white relative overflow-hidden select-none">
                    {isScanning ? (
                      <>
                        <Loader2 className="h-10 w-10 animate-spin text-[#2563EB] mb-2" />
                        <span className="text-xs font-bold tracking-widest uppercase animate-pulse">Scanning QR Code...</span>
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 animate-bounce" />
                      </>
                    ) : (
                      <>
                        <Camera className="h-12 w-12 text-slate-600 mb-2" />
                        <span className="text-xs font-bold text-slate-400">Webcam Stream Mockup</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={startCameraScan}
                    disabled={isScanning}
                    className="px-6 py-2.5 bg-[#2563EB] text-white hover:bg-blue-600 font-semibold rounded-lg text-xs cursor-pointer select-none"
                  >
                    Simulate Camera Scan
                  </button>
                </div>

                {/* Scan Result */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 bg-white dark:bg-zinc-900 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2">Scanner Verification Log</h4>

                  {scanResult ? (
                    <div className="p-4 border border-green-200 bg-green-50/50 rounded-xl dark:border-green-950 dark:bg-zinc-950/50 flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-xs font-bold text-green-800 dark:text-green-400">Check-In Successful</p>
                        <p className="text-xs font-mono font-medium text-slate-600 dark:text-zinc-300 mt-1">{scanResult}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-10 text-center">Awaiting QR scan execution...</p>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ================== CERTIFICATES TAB ================== */}
          {activeTab === "certificates" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">

              <div className="grid lg:grid-cols-2 gap-6">

                {/* Certificate Lookup */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 bg-white dark:bg-zinc-900 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2">Public Certificate Lookup</h4>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter verification hash (e.g. ESP-891-FX12)"
                      value={certificateHashSearch}
                      onChange={(e) => setCertificateHashSearch(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
                    />
                    <button onClick={handleCertLookup} className="px-4 py-2 bg-[#2563EB] text-white hover:bg-blue-600 rounded-lg text-xs font-semibold cursor-pointer">
                      Verify Lookup
                    </button>
                  </div>

                  {lookupResult && (
                    <div className="p-4 border border-slate-100 rounded-xl dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/20 text-xs space-y-3">
                      {lookupResult.status === "Not Found" ? (
                        <p className="text-red-500 font-semibold">{lookupResult.error}</p>
                      ) : (
                        <>
                          <div className="flex justify-between font-semibold"><span>Recipient:</span><span className="font-bold text-slate-900 dark:text-white">{lookupResult.recipient}</span></div>
                          <div className="flex justify-between font-semibold"><span>Event Title:</span><span className="font-bold text-slate-900 dark:text-white">{lookupResult.event}</span></div>
                          <div className="flex justify-between font-semibold"><span>Assigned Role:</span><span className="font-bold text-slate-900 dark:text-white">{lookupResult.role}</span></div>
                          <div className="flex justify-between font-semibold"><span>Date:</span><span className="font-bold text-slate-400">{lookupResult.date}</span></div>
                          <div className="flex justify-between font-semibold"><span>Verification:</span><span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">{lookupResult.status}</span></div>
                          <button onClick={() => alert("Downloading PDF Certificate...")} className="w-full py-2 bg-[#14B8A6] hover:bg-teal-600 text-white font-bold rounded-lg text-xs cursor-pointer mt-2">Download PDF Certificate</button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Generator details */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-zinc-950/20 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Automated Credential Dispatch</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    EventSphere compiles personalized landscape certificates asynchronously and distributes them in bulk via institutional mail queues. Third-party agencies can check validity by looking up the lookup registry code.
                  </p>

                  {["super_admin", "society_admin"].includes(currentRole) && (
                    <button onClick={() => setShowIssueCertModal(true)} className="w-full py-2.5 bg-[#2563EB] text-white hover:bg-blue-600 font-semibold rounded-lg text-xs cursor-pointer select-none">
                      Issue Single Certificate
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ================== ANNOUNCEMENTS TAB ================== */}
          {activeTab === "announcements" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold">Campus Announcements</h3>
                  <p className="text-xs text-slate-400">Broadcasted announcements & reminders from society admins.</p>
                </div>
                {["super_admin", "society_admin"].includes(currentRole) && (
                  <button onClick={() => setShowAnnounceModal(true)} className="px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-semibold hover:bg-blue-600 cursor-pointer">
                    + Broadcast Announcement
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {announcements.map(ann => (
                  <div key={ann.id} className="p-4 border border-slate-100 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{ann.tag}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{ann.date}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ann.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 leading-relaxed">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================== BUDGET TAB ================== */}
          {activeTab === "budget" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold">Financial Ledger & Invoices</h3>
                  <p className="text-xs text-slate-400">Track society budget allocations, spent ledgers, and invoice receipts.</p>
                </div>
              </div>

              {/* Allocated vs Spent progress bars */}
              <div className="grid md:grid-cols-2 gap-6 select-none">
                <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sound & AV Allocations</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Spent: ₹30,000</span>
                      <span>Allocated: ₹30,000</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-3">
                      <div className="bg-[#2563EB] h-3 rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Decorations Allocations</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Spent: ₹45,000</span>
                      <span>Allocated: ₹50,000</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-3">
                      <div className="bg-[#14B8A6] h-3 rounded-full" style={{ width: "90%" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 dark:border-zinc-800 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 text-slate-400 uppercase font-black tracking-wider">
                      <th className="p-4">Category</th>
                      <th className="p-4">Allocated</th>
                      <th className="p-4">Spent</th>
                      <th className="p-4">Remaining</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetItems.map(item => (
                      <tr key={item.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                        <td className="p-4 font-bold">{item.category}</td>
                        <td className="p-4 font-mono font-semibold">₹{item.allocated.toLocaleString()}</td>
                        <td className="p-4 font-mono font-semibold">₹{item.spent.toLocaleString()}</td>
                        <td className="p-4 font-mono font-semibold">₹{(item.allocated - item.spent).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded font-bold uppercase text-[9px]",
                            item.status === "Approved" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          )}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================== ANALYTICS TAB ================== */}
          {activeTab === "analytics" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6 select-none">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold">Platform Growth Analytics</h3>
                  <p className="text-xs text-slate-400">Audit society performance metrics and volunteer hour allocations.</p>
                </div>
              </div>

              {/* Dynamic CSS Grid charts */}
              <div className="grid md:grid-cols-2 gap-6">

                <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Participation Growth</h4>
                  <div className="flex items-end justify-between h-40 pt-6">
                    {[
                      { yr: "2023", h: "h-[30%]", val: "400" },
                      { yr: "2024", h: "h-[55%]", val: "850" },
                      { yr: "2025", h: "h-[80%]", val: "1.2k" },
                      { yr: "2026", h: "h-[98%]", val: "1.8k" }
                    ].map((b, idx) => (
                      <div key={idx} className="flex flex-col items-center flex-1 space-y-2">
                        <span className="text-[10px] font-bold text-[#2563EB]">{b.val}</span>
                        <div className={cn("w-12 bg-gradient-to-t from-[#2563EB] to-blue-400 rounded-t-lg", b.h)} />
                        <span className="text-[10px] text-slate-400 font-semibold">{b.yr}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volunteer Hours Contribution</h4>
                  <div className="flex items-end justify-between h-40 pt-6">
                    {[
                      { team: "Core", h: "h-[95%]", val: "380h" },
                      { team: "Web", h: "h-[75%]", val: "300h" },
                      { team: "Design", h: "h-[50%]", val: "200h" },
                      { team: "Logistics", h: "h-[85%]", val: "340h" }
                    ].map((b, idx) => (
                      <div key={idx} className="flex flex-col items-center flex-1 space-y-2">
                        <span className="text-[10px] font-bold text-[#14B8A6]">{b.val}</span>
                        <div className={cn("w-12 bg-gradient-to-t from-[#14B8A6] to-teal-300 rounded-t-lg", b.h)} />
                        <span className="text-[10px] text-slate-400 font-semibold">{b.team}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ================== REPORTS TAB ================== */}
          {activeTab === "reports" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold">Export Platform Reports</h3>
                  <p className="text-xs text-slate-400">Download formatted ledgers, registrations, or attendance rosters instantly.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { name: "Diwali Fest Registrations", desc: "List of all registered students, team rosters, and form values.", ext: "pdf" },
                  { name: "Annual Financial Ledger", desc: "Detailed breakdown of allocation budgets, invoice files, and sponsors.", ext: "xlsx" },
                  { name: "Verified Certificates Lookup", desc: "Hashed certificate codes, issued students list, and verification status.", ext: "csv" }
                ].map((rep, idx) => (
                  <div key={idx} className="border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 bg-slate-50/50 dark:bg-zinc-900/50">
                    <div>
                      <h4 className="font-bold text-sm">{rep.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rep.desc}</p>
                    </div>
                    <button
                      onClick={() => downloadReport(rep.ext)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold rounded-lg text-xs cursor-pointer text-center uppercase transition-all"
                    >
                      Download as {rep.ext}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================== GALLERY TAB ================== */}
          {activeTab === "gallery" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6 select-none">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold">Society Gallery</h3>
                  <p className="text-xs text-slate-400">View and upload highlights from recent campus events.</p>
                </div>
                {["super_admin", "society_admin"].includes(currentRole) && (
                  <button onClick={() => alert("Upload dialog triggered")} className="px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors">
                    + Upload Pictures
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="aspect-square rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-xs font-semibold text-slate-400 hover:opacity-90 cursor-pointer">
                    Mock Fest Photo #{idx + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================== SETTINGS TAB ================== */}
          {activeTab === "settings" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-4">
                <h3 className="text-lg font-bold">Account Settings</h3>
                <p className="text-xs text-slate-400">Configure profile settings and security details.</p>
              </div>

              <div className="max-w-md space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Registered Email</label>
                  <input type="text" disabled value={user?.email || "testing1234@gmail.com"} className="w-full bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-300 rounded-lg p-2 text-xs font-semibold outline-none cursor-not-allowed" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Assigned System Role</label>
                  <input type="text" disabled value={currentRole.toUpperCase().replace("_", " ")} className="w-full bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-300 rounded-lg p-2 text-xs font-semibold outline-none cursor-not-allowed" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Full Name</label>
                  <input type="text" defaultValue={user?.full_name || "Testing Admin"} className="w-full bg-white border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg p-2 text-xs font-semibold outline-none focus:border-[#2563EB]" />
                </div>

                <button onClick={() => alert("Settings saved")} className="px-4 py-2 bg-[#2563EB] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer">
                  Save Changes
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================= */}
      {/* ==================== QUICK ACTION MODALS ==================== */}
      {/* ========================================================= */}

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold">Create New Event</h3>
            <form onSubmit={executeCreateEvent} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Event Title *</label>
                <input type="text" required value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-[#2563EB]" placeholder="e.g. Diwali Fest 2026" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Schedule Date</label>
                  <input type="text" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-[#2563EB]" placeholder="e.g. July 12" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Venue Room *</label>
                  <input type="text" required value={newEvent.venue} onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })} className="w-full bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-[#2563EB]" placeholder="e.g. Auditorium" />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowCreateEventModal(false)} className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] text-white hover:bg-blue-600 rounded-lg text-xs font-semibold cursor-pointer">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Volunteer Modal */}
      {showAddVolunteerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold">Assign Volunteer Duty</h3>
            <form onSubmit={executeAddVolunteer} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Volunteer Name *</label>
                <input type="text" required value={newVolunteer.name} onChange={(e) => setNewVolunteer({ ...newVolunteer, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-[#2563EB]" placeholder="e.g. Priya Sharma" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowAddVolunteerModal(false)} className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] text-white hover:bg-blue-600 rounded-lg text-xs font-semibold cursor-pointer">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Certificate Modal */}
      {showIssueCertModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold">Issue Cryptographic Certificate</h3>
            <form onSubmit={executeIssueCert} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Student Name *</label>
                <input type="text" required value={newCert.studentName} onChange={(e) => setNewCert({ ...newCert, studentName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-[#2563EB]" placeholder="e.g. Aman Gupta" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Event Title *</label>
                <input type="text" required value={newCert.eventName} onChange={(e) => setNewCert({ ...newCert, eventName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-[#2563EB]" placeholder="e.g. Web Development Bootcamp" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowIssueCertModal(false)} className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] text-white hover:bg-blue-600 rounded-lg text-xs font-semibold cursor-pointer">Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold">Broadcast Announcement</h3>
            <form onSubmit={executeAnnounce} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Title *</label>
                <input type="text" required value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-[#2563EB]" placeholder="e.g. soundcheck reminder" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Announcement Body *</label>
                <textarea required value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} className="w-full bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg p-2 text-xs h-24 outline-none focus:border-[#2563EB]" placeholder="Enter announcement content..." />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowAnnounceModal(false)} className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] text-white hover:bg-blue-600 rounded-lg text-xs font-semibold cursor-pointer">Broadcast</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ==================== RIGHT DRAWERS & WIDGETS ==================== */}
      {/* ========================================================= */}

      {/* Team Chat Slide-over Drawer */}
      {showChatDrawer && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-slate-200 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xl z-40 flex flex-col justify-between select-none">
          <div className="h-16 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-4">
            <span className="font-bold text-sm tracking-tight text-slate-500 uppercase">Team Chat Workspace</span>
            <button onClick={() => setShowChatDrawer(false)} className="text-xs text-[#2563EB] hover:underline cursor-pointer">Close</button>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Channels</span>
              <div className="space-y-1">
                {["general", "web", "ai", "marketing", "design", "core"].map(ch => (
                  <button
                    key={ch}
                    onClick={() => setActiveChatChannel(ch)}
                    className={cn(
                      "flex items-center w-full px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all",
                      activeChatChannel === ch
                        ? "bg-[#2563EB]/10 text-[#2563EB] dark:bg-indigo-500/20 dark:text-indigo-400"
                        : "text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    )}
                  >
                    # {ch}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Messages history</span>
              <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-thin">
                {chatHistory[activeChatChannel].map(m => (
                  <div key={m.id} className="text-xs">
                    <p className="font-bold text-slate-700 dark:text-zinc-200">{m.sender} <span className="text-[9px] text-slate-400 font-normal">{m.time}</span></p>
                    <p className="text-slate-600 dark:text-zinc-300">{m.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Send message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
            />
            <button onClick={sendMessage} className="p-2 rounded-lg bg-[#2563EB] text-white hover:bg-blue-600 cursor-pointer"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) - Quick Actions */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-30 select-none">

        {/* Ask EventSphere AI Panel */}
        {showAiAssistant && (
          <div className="w-80 h-[380px] rounded-2xl border border-slate-200 bg-white shadow-2xl p-4 dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between mb-2">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#14B8A6] flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> Ask EventSphere AI</span>
                <button onClick={() => setShowAiAssistant(false)} className="text-xs text-slate-400 hover:underline cursor-pointer">Hide</button>
              </div>

              {/* Messages viewport */}
              <div className="h-[200px] overflow-y-auto px-1 space-y-3 scrollbar-thin">
                {aiMessages.map((msg, i) => (
                  <div key={i} className={cn("text-xs flex flex-col", msg.sender === "user" ? "items-end" : "items-start")}>
                    <div className={cn(
                      "p-2.5 rounded-xl max-w-[85%] leading-relaxed",
                      msg.sender === "user"
                        ? "bg-[#2563EB] text-white rounded-tr-none"
                        : "bg-slate-50 dark:bg-zinc-950 dark:text-zinc-300 rounded-tl-none border border-slate-100 dark:border-zinc-800/80"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations & Input */}
            <div className="space-y-2 border-t border-slate-100 dark:border-zinc-800 pt-2.5">
              <div className="flex flex-wrap gap-1.5">
                {aiPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAiPromptClick(p)}
                    className="text-[9px] font-bold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 px-2 py-0.5 rounded-full cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Ask assistant something..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAiInputSend()}
                  className="flex-1 bg-slate-50 border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#2563EB]"
                />
                <button onClick={handleAiInputSend} className="p-1.5 rounded-lg bg-[#2563EB] text-white hover:bg-blue-600 cursor-pointer"><Send className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {/* AI Toggle Button */}
          <button
            onClick={() => setShowAiAssistant(!showAiAssistant)}
            className="h-10 px-4 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#14B8A6] hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg select-none cursor-pointer"
          >
            <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: "3s" }} />
            <span>Ask EventSphere AI</span>
          </button>

          {/* Quick Actions Add FAB */}
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="w-10 h-10 rounded-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white flex items-center justify-center shadow-lg cursor-pointer"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

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
  }, [user, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );
}
