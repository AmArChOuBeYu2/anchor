"use client";

import { useState, useEffect } from "react";
import {
  X,
  Utensils,
  User,
  Phone,
  Target,
  TrendingUp,
  ShoppingBag,
  Calendar,
  Inbox,
  Loader2,
} from "lucide-react";

function formatTimestamp(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function LeadInfoCard({ lead }) {
  if (!lead) return null;

  return (
    <div className="mx-4 mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          Lead Captured
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {lead.name && (
          <div className="flex items-center gap-2 text-slate-300">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>{lead.name}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-slate-300">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.intent && (
          <div className="flex items-center gap-2 text-slate-300">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span className="capitalize">{lead.intent}</span>
          </div>
        )}
        {lead.buying_probability && (
          <div className="flex items-center gap-2 text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
            <span className="capitalize">
              {lead.buying_probability || lead.probability} probability
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConversationDetail({ conversation, onClose }) {
  const [detail, setDetail] = useState(conversation);
  const [isLoading, setIsLoading] = useState(false);

  const convoId = conversation?.id || conversation?.conversationId;

  useEffect(() => {
    setDetail(conversation);
    if (!convoId) return;

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/conversations/${convoId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setDetail(data);
      })
      .catch((err) => console.error("Failed to load conversation:", err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversation, convoId]);

  if (!conversation) {
    return (
      <div className="glass rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
          <Inbox className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">
          Select a Conversation
        </h3>
        <p className="text-sm text-slate-500 max-w-xs">
          Click on a conversation from the list to view the full transcript.
        </p>
      </div>
    );
  }

  const messages = detail?.messages || [];
  const displayId = detail?.id || detail?.conversationId || convoId || "Unknown";
  const startTime =
    detail?.startedAt || detail?.createdAt || detail?.timestamp;
  const lead = detail?.lead;

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/40 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-[#E35222]" />
            {detail?.customerName || displayId.slice(0, 12)}
          </h3>
          {startTime && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(startTime)}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lead Info */}
      {lead && <LeadInfoCard lead={lead} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading transcript…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-8">
            No messages in this conversation.
          </div>
        ) : (
          messages.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id || i}
                className={`flex items-end gap-2 ${
                  isUser ? "justify-end" : ""
                }`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E35222] to-orange-600 flex items-center justify-center shrink-0">
                    <Utensils className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    isUser
                      ? "bg-[#E35222]/90 text-white rounded-br-md"
                      : "bg-slate-800/60 text-slate-200 rounded-bl-md"
                  }`}
                >
                  <p>{msg.content}</p>
                  {msg.timestamp && (
                    <span
                      className={`block text-[10px] mt-1 ${
                        isUser ? "text-white/50" : "text-slate-500"
                      }`}
                    >
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  )}
                </div>
                {isUser && (
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-700/40 text-xs text-slate-500 shrink-0">
        {messages.length} messages
        {lead && " · Lead captured"}
      </div>
    </div>
  );
}
