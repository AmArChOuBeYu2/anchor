"use client";

import { MessageSquare, UserCheck, Clock, Inbox } from "lucide-react";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function truncateId(id) {
  if (!id) return "Unknown";
  if (id.length <= 12) return id;
  return id.slice(0, 6) + "…" + id.slice(-4);
}

export default function ConversationList({
  conversations = [],
  onSelect,
  selectedId,
}) {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
          <Inbox className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No Conversations Yet</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          When customers chat with your AI assistant, conversations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/40">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#E35222]" />
          Recent Conversations
          <span className="ml-auto text-xs text-slate-500 font-normal">
            {conversations.length} total
          </span>
        </h3>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-700/30">
        {conversations.map((convo, i) => {
          const isSelected = selectedId === (convo.id || convo.conversationId);
          const convoId = convo.id || convo.conversationId || `conv-${i}`;
          const messageCount =
            convo.messageCount || convo.messages?.length || 0;
          const hasLead = convo.hasLead || convo.lead;
          const startTime =
            convo.startedAt || convo.createdAt || convo.timestamp;

          return (
            <button
              key={convoId}
              onClick={() => onSelect?.(convo)}
              className={`w-full text-left px-5 py-3.5 flex items-center gap-3 transition-all duration-200 hover:bg-slate-700/30 group ${
                isSelected
                  ? "bg-[#E35222]/10 border-l-2 border-[#E35222]"
                  : "border-l-2 border-transparent"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isSelected
                    ? "bg-[#E35222]/20 text-[#E35222]"
                    : "bg-slate-700/60 text-slate-400 group-hover:bg-slate-700"
                }`}
              >
                {(convo.customerName || convoId).charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`text-sm font-medium truncate ${
                      isSelected ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {convo.customerName || truncateId(convoId)}
                  </span>
                  {hasLead && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold shrink-0">
                      <UserCheck className="w-2.5 h-2.5" />
                      Lead
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {startTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(startTime)}
                    </span>
                  )}
                  <span>{messageCount} messages</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
