"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const COLOR_MAP = {
  orange: {
    gradient: "from-[#E35222]/20 via-transparent to-transparent",
    icon: "bg-[#E35222]/15 text-[#E35222]",
    border: "border-[#E35222]/10",
  },
  amber: {
    gradient: "from-amber-500/20 via-transparent to-transparent",
    icon: "bg-amber-500/15 text-amber-400",
    border: "border-amber-500/10",
  },
  emerald: {
    gradient: "from-emerald-500/20 via-transparent to-transparent",
    icon: "bg-emerald-500/15 text-emerald-400",
    border: "border-emerald-500/10",
  },
  blue: {
    gradient: "from-blue-500/20 via-transparent to-transparent",
    icon: "bg-blue-500/15 text-blue-400",
    border: "border-blue-500/10",
  },
  purple: {
    gradient: "from-purple-500/20 via-transparent to-transparent",
    icon: "bg-purple-500/15 text-purple-400",
    border: "border-purple-500/10",
  },
  red: {
    gradient: "from-red-500/20 via-transparent to-transparent",
    icon: "bg-red-500/15 text-red-400",
    border: "border-red-500/10",
  },
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "orange",
}) {
  const colors = COLOR_MAP[color] || COLOR_MAP.orange;

  const trendIcon =
    trend > 0 ? (
      <TrendingUp className="w-3.5 h-3.5" />
    ) : trend < 0 ? (
      <TrendingDown className="w-3.5 h-3.5" />
    ) : (
      <Minus className="w-3.5 h-3.5" />
    );

  const trendColor =
    trend > 0
      ? "text-emerald-400 bg-emerald-400/10"
      : trend < 0
      ? "text-red-400 bg-red-400/10"
      : "text-slate-400 bg-slate-400/10";

  return (
    <div
      className={`group relative glass rounded-2xl p-5 sm:p-6 overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 ${colors.border}`}
    >
      {/* Gradient accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${colors.gradient} pointer-events-none`}
      />

      <div className="relative">
        {/* Header: icon + trend */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-11 h-11 rounded-xl ${colors.icon} flex items-center justify-center`}
          >
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          {trend !== undefined && trend !== null && (
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${trendColor}`}
            >
              {trendIcon}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="text-3xl sm:text-4xl font-bold text-white mb-1 tracking-tight">
          {value}
        </div>

        {/* Title */}
        <div className="text-sm font-medium text-slate-400 mb-0.5">{title}</div>

        {/* Subtitle */}
        {subtitle && (
          <div className="text-xs text-slate-500">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
