"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 shadow-2xl border border-slate-700/40">
      <p className="text-xs font-semibold text-white mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400 capitalize">{entry.name}:</span>
          <span className="text-white font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">
          No Analytics Data Yet
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Once conversations start flowing, you&apos;ll see trends and analytics here.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/40 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#E35222]" />
          Conversation Trends
        </h3>
        <span className="text-xs text-slate-500">Last {data.length} days</span>
      </div>

      {/* Chart */}
      <div className="px-2 py-4 sm:px-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E35222" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#E35222" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(71, 85, 105, 0.3)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 16 }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="conversations"
              name="Conversations"
              stroke="#E35222"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConversations)"
              dot={false}
              activeDot={{
                r: 4,
                stroke: "#E35222",
                strokeWidth: 2,
                fill: "#0a0a0f",
              }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              name="Leads"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLeads)"
              dot={false}
              activeDot={{
                r: 4,
                stroke: "#10b981",
                strokeWidth: 2,
                fill: "#0a0a0f",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
