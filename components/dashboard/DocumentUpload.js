"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  Check,
  X,
  Loader2,
  AlertCircle,
  Clipboard,
  File,
  Trash2,
} from "lucide-react";

const STATUS_MAP = {
  idle: { label: "Ready", color: "text-slate-400", icon: Upload },
  uploading: { label: "Uploading…", color: "text-amber-400", icon: Loader2 },
  processing: { label: "Processing…", color: "text-blue-400", icon: Loader2 },
  done: { label: "Complete", color: "text-emerald-400", icon: Check },
  error: { label: "Error", color: "text-red-400", icon: AlertCircle },
};

export default function DocumentUpload({ documents = [], onUploadComplete }) {
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("file"); // 'file' | 'paste'
  const [pasteText, setPasteText] = useState("");
  const [pasteName, setPasteName] = useState("");
  const fileInputRef = useRef(null);

  const uploadFile = useCallback(
    async (text, filename) => {
      setStatus("uploading");
      setErrorMsg("");

      try {
        // Simulate brief network delay for UX
        await new Promise((r) => setTimeout(r, 300));
        setStatus("processing");

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, filename }),
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const data = await response.json();
        setStatus("done");
        onUploadComplete?.(data);

        // Reset after showing success
        setTimeout(() => {
          setStatus("idle");
          setPasteText("");
          setPasteName("");
        }, 3000);
      } catch (err) {
        console.error("Upload error:", err);
        setStatus("error");
        setErrorMsg(err.message || "Upload failed. Please try again.");
        setTimeout(() => setStatus("idle"), 5000);
      }
    },
    [onUploadComplete]
  );

  const handleFileSelect = useCallback(
    async (file) => {
      if (!file) return;

      if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
        setStatus("error");
        setErrorMsg("Only .txt files are supported.");
        setTimeout(() => setStatus("idle"), 3000);
        return;
      }

      try {
        const text = await file.text();
        await uploadFile(text, file.name);
      } catch (err) {
        setStatus("error");
        setErrorMsg("Could not read file.");
        setTimeout(() => setStatus("idle"), 3000);
      }
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handlePasteSubmit = useCallback(async () => {
    if (!pasteText.trim()) return;
    const name = pasteName.trim() || `pasted-${Date.now()}.txt`;
    await uploadFile(pasteText, name);
  }, [pasteText, pasteName, uploadFile]);

  const StatusIcon = STATUS_MAP[status]?.icon || Upload;
  const isUploading = status === "uploading" || status === "processing";

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-1 bg-slate-800/40 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("file")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "file"
              ? "bg-[#E35222] text-white shadow-lg shadow-orange-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            File Upload
          </span>
        </button>
        <button
          onClick={() => setActiveTab("paste")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "paste"
              ? "bg-[#E35222] text-white shadow-lg shadow-orange-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-2">
            <Clipboard className="w-4 h-4" />
            Paste Text
          </span>
        </button>
      </div>

      {/* File Upload Tab */}
      {activeTab === "file" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`glass rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
            dragOver
              ? "border-[#E35222] bg-[#E35222]/5 scale-[1.01]"
              : "hover:bg-slate-700/20"
          } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />

          <div
            className={`w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center ${
              status === "done"
                ? "bg-emerald-500/15"
                : status === "error"
                ? "bg-red-500/15"
                : "bg-[#E35222]/10"
            }`}
          >
            <StatusIcon
              className={`w-7 h-7 ${STATUS_MAP[status]?.color} ${
                isUploading ? "animate-spin" : ""
              }`}
            />
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">
            {status === "idle" && "Drop your document here"}
            {status === "uploading" && "Uploading document…"}
            {status === "processing" && "Processing with AI…"}
            {status === "done" && "Upload complete!"}
            {status === "error" && "Upload failed"}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {status === "idle" &&
              "Drag & drop a .txt file or click to browse. Menu, FAQs, policies — anything your AI should know."}
            {status === "uploading" && "Sending your document to the server…"}
            {status === "processing" &&
              "Your AI is learning from this document…"}
            {status === "done" &&
              "Document has been processed and added to your knowledge base."}
            {status === "error" && errorMsg}
          </p>

          {status === "idle" && (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E35222] hover:bg-[#c9441a] text-white text-sm font-semibold rounded-xl transition-colors">
              <Upload className="w-4 h-4" />
              Choose File
            </div>
          )}
        </div>
      )}

      {/* Paste Text Tab */}
      {activeTab === "paste" && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Document Name (optional)
            </label>
            <input
              type="text"
              value={pasteName}
              onChange={(e) => setPasteName(e.target.value)}
              placeholder="e.g., Menu Items, FAQ, Policies"
              className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#E35222]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Content
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your restaurant's menu, FAQs, policies, or any text content here…"
              rows={8}
              className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#E35222]/50 transition-colors resize-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {pasteText.length > 0 && `${pasteText.length} characters`}
            </span>
            <button
              onClick={handlePasteSubmit}
              disabled={!pasteText.trim() || isUploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E35222] hover:bg-[#c9441a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload Text
            </button>
          </div>

          {/* Status feedback for paste tab */}
          {status !== "idle" && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                status === "done"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : status === "error"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              <StatusIcon
                className={`w-4 h-4 ${isUploading ? "animate-spin" : ""}`}
              />
              <span>
                {STATUS_MAP[status]?.label}
                {status === "error" && `: ${errorMsg}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Document List */}
      {documents && documents.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/40">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#E35222]" />
              Knowledge Base
              <span className="ml-auto text-xs text-slate-500 font-normal">
                {documents.length} documents
              </span>
            </h3>
          </div>
          <div className="divide-y divide-slate-700/30">
            {documents.map((doc, i) => (
              <div
                key={doc.id || i}
                className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-700/20 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
                  <File className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate">
                    {doc.filename || doc.name || `Document ${i + 1}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {doc.chunks
                      ? `${doc.chunks} chunks`
                      : doc.size
                      ? `${(doc.size / 1024).toFixed(1)} KB`
                      : "Processed"}
                  </p>
                </div>
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
