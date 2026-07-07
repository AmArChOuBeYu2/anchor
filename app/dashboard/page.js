"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  UserCheck,
  Flame,
  DollarSign,
  LayoutDashboard,
  Users,
  FileText,
  Sparkles,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Hash,
  ArrowLeft,
  X,
} from "lucide-react";

import MetricCard from "@/components/dashboard/MetricCard";
import ConversationList from "@/components/dashboard/ConversationList";
import ConversationDetail from "@/components/dashboard/ConversationDetail";
import LeadTable from "@/components/dashboard/LeadTable";
import DocumentUpload from "@/components/dashboard/DocumentUpload";
import OwnerCopilot from "@/components/dashboard/OwnerCopilot";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "leads", label: "Leads", icon: Users },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "copilot", label: "Copilot", icon: Sparkles },
];

// Skeleton component for loading states
function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

function SkeletonDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass rounded-2xl p-6 space-y-4">
            <Skeleton className="w-11 h-11 rounded-xl" />
            <Skeleton className="w-24 h-8" />
            <Skeleton className="w-32 h-4" />
          </div>
        ))}
      </div>
      {/* Content skeleton */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="glass rounded-2xl p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-48 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-6 h-6 rounded" />
                <Skeleton className="flex-1 h-4" />
                <Skeleton className="w-8 h-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="glass rounded-2xl p-6">
        <Skeleton className="w-full h-64" />
      </div>
    </div>
  );
}

// Topics panel
function TopTopics({ topics = [] }) {
  if (!topics || topics.length === 0) {
    const defaultTopics = [
      { topic: "Menu inquiries", count: 0 },
      { topic: "Reservations", count: 0 },
      { topic: "Pricing", count: 0 },
    ];
    return (
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/40">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#E35222]" />
            Top Topics
          </h3>
        </div>
        <div className="p-5 text-center text-sm text-slate-500">
          Topics will appear as conversations accumulate.
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...topics.map((t) => t.count || 0), 1);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/40">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Hash className="w-4 h-4 text-[#E35222]" />
          Top Topics
          <span className="ml-auto text-xs text-slate-500 font-normal">
            {topics.length} topics
          </span>
        </h3>
      </div>
      <div className="p-5 space-y-4">
        {topics.slice(0, 8).map((item, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300 font-medium truncate pr-4">
                {item.topic || item.name}
              </span>
              <span className="text-slate-500 text-xs shrink-0">
                {item.count}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E35222] to-orange-500 rounded-full transition-all duration-500"
                style={{
                  width: `${((item.count || 0) / maxCount) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
      const result = await response.json();
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setData((prev) =>
        prev || {
          metrics: {
            totalChats: 0,
            leadsCaptured: 0,
            hotLeads: 0,
            revenuePotential: 0,
          },
          conversations: [],
          leads: [],
          topics: [],
          analytics: [],
          documents: [],
        }
      );
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const metrics = data?.metrics || {};
  const conversations = data?.conversations || [];
  const leads = data?.leads || [];
  const topics = data?.topics || [];
  const analytics = data?.analytics || [];
  const documents = data?.documents || [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo + title */}
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#E35222] to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20"
              >
                <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </a>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight">
                  Anchor Dashboard
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  AI Employee for Indian Accent
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {lastRefresh && (
                <span className="text-xs text-slate-600 hidden sm:block">
                  Updated{" "}
                  {lastRefresh.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              <button
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                title="Refresh data"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
              <a
                href="/"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 text-sm text-slate-400 hover:text-white transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Site
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ─── Tab Navigation ─── */}
        <div className="flex gap-1 bg-slate-800/30 rounded-xl p-1 mb-8 overflow-x-auto w-fit max-w-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#E35222] text-white shadow-lg shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === "leads" && leads.length > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#E35222]/15 text-[#E35222]"
                    }`}
                  >
                    {leads.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Loading State ─── */}
        {isLoading ? (
          <SkeletonDashboard />
        ) : (
          <>
            {/* Error banner */}
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2 animate-fade-in">
                <span>⚠️ Could not refresh data: {error}</span>
                <button
                  onClick={() => fetchData()}
                  className="ml-auto text-red-400 hover:text-red-300 underline text-xs"
                >
                  Retry
                </button>
              </div>
            )}

            {/* ═══════ OVERVIEW TAB ═══════ */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-in">
                {/* Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <MetricCard
                    title="Chats Today"
                    value={metrics.totalChats ?? 0}
                    subtitle="Customer conversations"
                    icon={MessageSquare}
                    color="orange"
                  />
                  <MetricCard
                    title="Leads Captured"
                    value={metrics.leadsCaptured ?? leads.length}
                    subtitle="Qualified prospects"
                    icon={UserCheck}
                    color="emerald"
                  />
                  <MetricCard
                    title="Hot Leads"
                    value={
                      metrics.hotLeads ??
                      leads.filter(
                        (l) =>
                          (l.probability || l.buying_probability)?.toLowerCase() ===
                          "high"
                      ).length
                    }
                    subtitle="High probability"
                    icon={Flame}
                    color="red"
                  />
                  <MetricCard
                    title="Revenue Potential"
                    value={`₹${(
                      metrics.revenuePotential ??
                      leads.reduce(
                        (sum, l) =>
                          sum +
                          (l.revenue ||
                            l.estimatedRevenue ||
                            l.estimated_revenue ||
                            0),
                        0
                      )
                    ).toLocaleString("en-IN")}`}
                    subtitle="Estimated pipeline"
                    icon={DollarSign}
                    color="amber"
                  />
                </div>

                {/* Conversations + Topics */}
                <div className="grid lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3">
                    <ConversationList
                      conversations={conversations}
                      selectedId={
                        selectedConversation?.id ||
                        selectedConversation?.conversationId
                      }
                      onSelect={setSelectedConversation}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <TopTopics topics={topics} />
                  </div>
                </div>

                {/* Analytics Chart */}
                <AnalyticsChart data={analytics} />
              </div>
            )}

            {/* ═══════ LEADS TAB ═══════ */}
            {activeTab === "leads" && (
              <div className="animate-fade-in">
                <LeadTable leads={leads} />
              </div>
            )}

            {/* ═══════ DOCUMENTS TAB ═══════ */}
            {activeTab === "documents" && (
              <div className="animate-fade-in max-w-3xl">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-1">
                    Knowledge Base
                  </h2>
                  <p className="text-sm text-slate-400">
                    Upload documents to train your AI assistant. It will use
                    this content to answer customer questions accurately.
                  </p>
                </div>
                <DocumentUpload
                  documents={documents}
                  onUploadComplete={() => fetchData(true)}
                />
              </div>
            )}

            {/* ═══════ COPILOT TAB ═══════ */}
            {activeTab === "copilot" && (
              <div className="animate-fade-in max-w-3xl">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-1">
                    Business Copilot
                  </h2>
                  <p className="text-sm text-slate-400">
                    Your AI-powered business advisor. Ask questions about
                    customers, leads, revenue, and get actionable insights.
                  </p>
                </div>
                <OwnerCopilot />
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── Conversation Detail Slide-over ─── */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedConversation(null)}
          />
          {/* Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-[#0c0f1a] border-l border-slate-700/40 shadow-2xl animate-slide-in flex flex-col">
            {/* Mobile back button */}
            <div className="sm:hidden px-4 py-3 border-b border-slate-700/40 flex items-center gap-2">
              <button
                onClick={() => setSelectedConversation(null)}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConversationDetail
                conversation={selectedConversation}
                onClose={() => setSelectedConversation(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
