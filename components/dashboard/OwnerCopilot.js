"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
  Lightbulb,
  TrendingUp,
  Target,
  BarChart3,
} from "lucide-react";

const SUGGESTED_QUESTIONS = [
  {
    text: "What did customers ask today?",
    icon: Lightbulb,
  },
  {
    text: "Show me hot leads",
    icon: Target,
  },
  {
    text: "What should I focus on?",
    icon: TrendingUp,
  },
  {
    text: "Revenue summary",
    icon: BarChart3,
  },
];

function CopilotMessage({ message }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex items-start gap-3 ${
        isUser ? "justify-end" : ""
      } animate-fade-in-up`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E35222] to-orange-600 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-orange-500/20">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-[#E35222] text-white rounded-tr-md"
            : "glass-light text-slate-200 rounded-tl-md"
        }`}
      >
        {/* Render message with basic formatting */}
        {message.content.split("\n").map((line, i) => (
          <p key={i} className={i > 0 ? "mt-1.5" : ""}>
            {line}
          </p>
        ))}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4 text-slate-300" />
        </div>
      )}
    </div>
  );
}

export default function OwnerCopilot() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const sendQuestion = useCallback(
    async (question) => {
      const text = question.trim();
      if (!text || isLoading) return;

      const userMsg = {
        id: "u-" + Date.now(),
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputValue("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text }),
        });

        if (!response.ok) throw new Error("Failed to get response");

        const data = await response.json();
        const assistantMsg = {
          id: "a-" + Date.now(),
          role: "assistant",
          content: data.reply || data.answer || "I couldn't process that request. Please try again.",
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        console.error("Copilot error:", err);
        const errorMsg = {
          id: "e-" + Date.now(),
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const handleSend = () => sendQuestion(inputValue);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/40 shrink-0 bg-gradient-to-r from-[#E35222]/10 via-transparent to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E35222] to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Business Copilot</h3>
            <p className="text-xs text-slate-400">
              Ask anything about your business performance
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E35222]/10 flex items-center justify-center mb-5">
              <Sparkles className="w-8 h-8 text-[#E35222]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Your AI Business Advisor
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mb-8">
              Ask me about your conversations, leads, customer patterns, or get
              recommendations for your business.
            </p>

            {/* Suggested Questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendQuestion(q.text)}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/30 hover:border-[#E35222]/30 text-sm text-slate-300 hover:text-white transition-all text-left group"
                >
                  <q.icon className="w-4 h-4 text-slate-500 group-hover:text-[#E35222] transition-colors shrink-0" />
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <CopilotMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E35222] to-orange-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="glass-light rounded-2xl rounded-tl-md px-4 py-3 flex gap-1.5">
                  <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block" />
                  <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block" />
                  <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggestion Chips (when conversation started) */}
      {messages.length > 0 && !isLoading && (
        <div className="px-5 py-2 border-t border-slate-700/20 shrink-0 overflow-x-auto">
          <div className="flex gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendQuestion(q.text)}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/30 text-xs text-slate-400 hover:text-white transition-all shrink-0"
              >
                {q.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-4 border-t border-slate-700/40 shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your business..."
            className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#E35222]/50 transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-[#E35222] hover:bg-[#c9441a] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/20 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
