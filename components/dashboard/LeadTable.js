"use client";

import {
  UserCheck,
  Phone,
  Target,
  DollarSign,
  AlertTriangle,
  Inbox,
  ArrowUpRight,
} from "lucide-react";

const PROBABILITY_STYLES = {
  high: "bg-red-500/15 text-red-400 border-red-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  low: "bg-slate-600/15 text-slate-400 border-slate-600/20",
};

const URGENCY_STYLES = {
  high: "bg-red-500/15 text-red-400",
  medium: "bg-amber-500/15 text-amber-400",
  low: "bg-slate-600/15 text-slate-400",
};

function ProbabilityBadge({ level }) {
  const style =
    PROBABILITY_STYLES[level?.toLowerCase()] || PROBABILITY_STYLES.low;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border capitalize ${style}`}
    >
      {level || "unknown"}
    </span>
  );
}

function UrgencyBadge({ level }) {
  const style =
    URGENCY_STYLES[level?.toLowerCase()] || URGENCY_STYLES.low;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${style}`}
    >
      {level || "—"}
    </span>
  );
}

export default function LeadTable({ leads = [] }) {
  if (!leads || leads.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
          <Inbox className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">
          No Leads Captured Yet
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          When your AI assistant identifies potential leads from conversations, they&apos;ll
          appear here with qualification details.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/40 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#E35222]" />
          Captured Leads
        </h3>
        <span className="text-xs text-slate-500">{leads.length} leads</span>
      </div>

      {/* Table wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/40 text-xs text-slate-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-semibold">Name</th>
              <th className="text-left px-5 py-3 font-semibold">Phone</th>
              <th className="text-left px-5 py-3 font-semibold">Intent</th>
              <th className="text-left px-5 py-3 font-semibold">Product</th>
              <th className="text-left px-5 py-3 font-semibold">Probability</th>
              <th className="text-left px-5 py-3 font-semibold">Urgency</th>
              <th className="text-left px-5 py-3 font-semibold">Action</th>
              <th className="text-right px-5 py-3 font-semibold">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {leads.map((lead, i) => (
              <tr
                key={lead.id || i}
                className="hover:bg-slate-700/20 transition-colors group"
              >
                {/* Name */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#E35222]/15 flex items-center justify-center text-[#E35222] text-xs font-bold shrink-0">
                      {(lead.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-slate-200 font-medium whitespace-nowrap">
                      {lead.name || "Anonymous"}
                    </span>
                  </div>
                </td>

                {/* Phone */}
                <td className="px-5 py-3.5">
                  <span className="text-slate-300 flex items-center gap-1 whitespace-nowrap">
                    <Phone className="w-3 h-3 text-slate-500" />
                    {lead.phone || "—"}
                  </span>
                </td>

                {/* Intent */}
                <td className="px-5 py-3.5">
                  <span className="text-slate-300 capitalize whitespace-nowrap">
                    {lead.intent || "—"}
                  </span>
                </td>

                {/* Product */}
                <td className="px-5 py-3.5">
                  <span className="text-slate-400 whitespace-nowrap">
                    {lead.product ||
                      lead.interested_product ||
                      lead.interest ||
                      "—"}
                  </span>
                </td>

                {/* Probability */}
                <td className="px-5 py-3.5">
                  <ProbabilityBadge
                    level={lead.probability || lead.buying_probability}
                  />
                </td>

                {/* Urgency */}
                <td className="px-5 py-3.5">
                  <UrgencyBadge level={lead.urgency} />
                </td>

                {/* Action */}
                <td className="px-5 py-3.5">
                  <span className="text-slate-400 text-xs whitespace-nowrap max-w-[160px] truncate block">
                    {lead.action ||
                      lead.recommended_action ||
                      lead.suggestedAction ||
                      "Follow up"}
                  </span>
                </td>

                {/* Revenue */}
                <td className="px-5 py-3.5 text-right">
                  <span className="text-slate-200 font-semibold whitespace-nowrap">
                    {lead.revenue ||
                    lead.estimatedRevenue ||
                    lead.estimated_revenue
                      ? `₹${(
                          lead.revenue ||
                          lead.estimatedRevenue ||
                          lead.estimated_revenue
                        ).toLocaleString("en-IN")}`
                      : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="px-5 py-3 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-500">
        <span>
          {
            leads.filter(
              (l) =>
                (l.probability || l.buying_probability)?.toLowerCase() === "high"
            ).length
          }{" "}
          hot leads
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          Total est. revenue: ₹
          {leads
            .reduce(
              (sum, l) =>
                sum +
                (l.revenue ||
                  l.estimatedRevenue ||
                  l.estimated_revenue ||
                  0),
              0
            )
            .toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}
