"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Utensils,
  Check,
  AlertCircle,
} from "lucide-react";

const INITIAL_MESSAGE = {
  id: "greeting",
  role: "assistant",
  content:
    "Hello! 👋 Welcome to Indian Accent. I'm here to help with menu questions, reservations, or anything else. How can I assist you today?",
  timestamp: new Date().toISOString(),
};

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 chat-message-assistant">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E35222] to-orange-600 flex items-center justify-center shrink-0">
        <Utensils className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="glass-light rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
        <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block" />
        <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block" />
        <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block" />
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex items-end gap-2 ${
        isUser ? "justify-end chat-message-user" : "chat-message-assistant"
      }`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E35222] to-orange-600 flex items-center justify-center shrink-0">
          <Utensils className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[#E35222] text-white rounded-br-md"
            : "glass-light text-slate-200 rounded-bl-md"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="absolute top-14 left-3 right-3 z-50 animate-slide-in">
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md text-sm text-emerald-300">
        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [toast, setToast] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
      setHasNewMessage(false);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: "u-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          ...(conversationId ? { conversationId } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // Store conversation ID from response
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage = {
        id: "a-" + Date.now(),
        role: "assistant",
        content:
          data.response ||
          data.reply ||
          data.message ||
          "I apologize, I couldn't process that request. Could you try again?",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Check if lead was captured — show toast
      if (data.leadCaptured && data.phone) {
        setToast(`✓ WhatsApp confirmation sent to ${data.phone}`);
      } else if (data.leadCaptured) {
        setToast("✓ Your details have been noted! We'll be in touch.");
      }

      if (!isOpen) {
        setHasNewMessage(true);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: "err-" + Date.now(),
        role: "assistant",
        content:
          "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or call us at +91 11 4363 3333.",
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ─── Chat Window ─── */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 right-0 sm:right-6 z-[9999] w-full sm:w-[400px] h-[100dvh] sm:h-[550px] flex flex-col animate-slide-up">
          <div className="flex flex-col h-full bg-[#0c0f1a]/95 backdrop-blur-2xl sm:rounded-2xl border border-slate-700/40 shadow-2xl shadow-black/50 overflow-hidden">
            {/* Header */}
            <div className="relative flex items-center justify-between px-5 py-4 border-b border-slate-700/40 bg-gradient-to-r from-[#E35222]/10 via-transparent to-transparent shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E35222] to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Indian Accent</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    AI Assistant — Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
              {/* Toast */}
              {toast && <Toast message={toast} onClose={() => setToast(null)} />}
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            >
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-4 py-3 border-t border-slate-700/40 bg-[#0c0f1a]/80">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about menu, reservations..."
                  className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#E35222]/50 transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-10 h-10 rounded-xl bg-[#E35222] hover:bg-[#c9441a] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/20 shrink-0"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-600 mt-2">
                Powered by <span className="text-slate-500 font-medium">Anchor</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Telegram Floating Button ─── */}
      {!isOpen && (
        <a
          href="https://t.me/AnchorAccentBot"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-7 z-[10000] w-12 h-12 rounded-full bg-[#0088cc] hover:bg-[#0077b5] flex items-center justify-center shadow-xl hover:shadow-sky-500/20 transition-all duration-300 hover:scale-110 group animate-slide-up"
          title="Chat with our Telegram Bot"
        >
          {/* Tooltip on hover */}
          <span className="absolute right-14 scale-0 group-hover:scale-100 transition-all duration-200 origin-right whitespace-nowrap bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg shadow-lg">
            Chat on Telegram
          </span>
          <svg className="w-5.5 h-5.5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.98 1.25-5.59 3.69-.53.36-1 .53-1.42.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.36-.49.99-.74 3.87-1.69 6.45-2.8 7.74-3.35 3.69-1.54 4.45-1.81 4.95-1.82.11 0 .36.03.52.16.14.11.18.27.19.38.01.08.01.23 0 .3z"/>
          </svg>
        </a>
      )}

      {/* ─── Floating Button ─── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-[10000] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 ${
          isOpen
            ? "bg-slate-700 hover:bg-slate-600 rotate-0"
            : "bg-[#E35222] hover:bg-[#c9441a] animate-pulse-glow"
        }`}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#E35222]/40 animate-pulse-ring" />
        )}
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {/* New message badge */}
        {!isOpen && hasNewMessage && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0a0a0f] animate-scale-in" />
        )}
      </button>
    </>
  );
}
