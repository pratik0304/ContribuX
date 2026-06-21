"use client";
 
import { useState, useEffect, useRef } from "react";
import { TrendingUp, Users, Eye, IndianRupee, ArrowUpRight, Loader2, FileText } from "lucide-react";

interface InsightStats {
  supporters: number;
  posts: number;
  monthlyRevenue: number;
  pageViews: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  supporters: number;
}

interface TopContent {
  title: string;
  views: number;
  likes: number;
}

function InteractiveChart({
  data,
  xKey,
  yKey,
  prefix = "",
  gradientColors = ["#6366f1", "#a855f7"],
  strokeColor = "#6366f1",
  chartType = "area"
}: {
  data: any[];
  xKey: string;
  yKey: string;
  prefix?: string;
  gradientColors?: [string, string];
  strokeColor?: string;
  chartType?: "area" | "line";
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) return null;

  const values = data.map(d => d[yKey] || 0);
  const maxValue = Math.max(...values, 10);

  const width = 600;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Generate points
  const points = data.map((d, index) => {
    const x = paddingLeft + (data.length > 1 ? (index / (data.length - 1)) * chartWidth : chartWidth / 2);
    const y = paddingTop + chartHeight - (maxValue > 0 ? (d[yKey] / maxValue) * chartHeight : 0);
    return { x, y, data: d };
  });

  // SVG Path description
  let pathD = "";
  let areaD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  // Grid lines
  const gridLinesCount = 4;
  const gridLines = Array.from({ length: gridLinesCount }).map((_, idx) => {
    const val = (maxValue / (gridLinesCount - 1)) * idx;
    const y = paddingTop + chartHeight - (maxValue > 0 ? (val / maxValue) * chartHeight : 0);
    
    // Format label nicely
    let formattedLabel = "";
    if (val >= 1000) {
      formattedLabel = `${prefix}${(val / 1000).toFixed(1)}k`;
    } else {
      formattedLabel = `${prefix}${Math.round(val)}`;
    }
    
    return { y, label: formattedLabel };
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;

    // Find closest point
    let closestIndex = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const pointXInRect = (p.x / width) * rect.width;
      const diff = Math.abs(pointXInRect - clientX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    setHoveredIndex(closestIndex);
    
    const hoveredPoint = points[closestIndex];
    const tooltipX = (hoveredPoint.x / width) * rect.width;
    const tooltipY = (hoveredPoint.y / height) * rect.height - 10;
    setTooltipPos({ x: tooltipX, y: tooltipY });
  };

  const gradientId = `gradient-${yKey}`;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible select-none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientColors[0]} stopOpacity="0.3" />
            <stop offset="100%" stopColor={gradientColors[1]} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines & Y Axis Labels */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line 
              x1={paddingLeft} 
              y1={line.y} 
              x2={width - paddingRight} 
              y2={line.y} 
              className="stroke-white/[0.04] stroke-[1px]"
              strokeDasharray="4 4"
            />
            <text 
              x={paddingLeft - 10} 
              y={line.y + 3} 
              textAnchor="end" 
              className="fill-gray-500 text-[10px] font-medium font-mono"
            >
              {line.label}
            </text>
          </g>
        ))}

        {/* Area Fill */}
        {chartType === "area" && areaD && (
          <path d={areaD} fill={`url(#${gradientId})`} className="transition-all duration-300" />
        )}

        {/* Line Path */}
        {pathD && (
          <path 
            d={pathD} 
            fill="none" 
            stroke={strokeColor} 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="transition-all duration-300" 
          />
        )}

        {/* X Axis Labels */}
        {points.map((p, idx) => (
          <text 
            key={idx} 
            x={p.x} 
            y={height - 12} 
            textAnchor="middle" 
            className="fill-gray-400 text-[11px] font-sans font-medium"
          >
            {p.data[xKey]}
          </text>
        ))}

        {/* Hover Indicator Vertical Line */}
        {hoveredIndex !== null && (
          <line 
            x1={points[hoveredIndex].x} 
            y1={paddingTop} 
            x2={points[hoveredIndex].x} 
            y2={paddingTop + chartHeight} 
            className="stroke-white/[0.08] stroke-[1px]"
          />
        )}

        {/* Interactive dots */}
        {points.map((p, idx) => (
          <circle 
            key={idx}
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === idx ? 6 : 4}
            className={`transition-all duration-150 cursor-pointer`}
            style={{ fill: hoveredIndex === idx ? "#ffffff" : "#12121e", stroke: strokeColor, strokeWidth: hoveredIndex === idx ? 3 : 2 }}
          />
        ))}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredIndex !== null && (
        <div 
          className="absolute z-20 bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 shadow-2xl text-center pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{data[hoveredIndex][xKey]}</p>
          <p className="text-sm font-extrabold text-white mt-0.5">
            {prefix}{data[hoveredIndex][yKey].toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default function InsightsPage() {
  const [stats, setStats] = useState<InsightStats>({ supporters: 0, posts: 0, monthlyRevenue: 0, pageViews: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/insights");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setMonthlyData(data.monthlyData);
          setTopContent(data.topContent);
        }
      } catch (err) {
        console.error("Failed to fetch creator insights:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm">Generating creator analytics...</p>
      </div>
    );
  }

  const displayStats = [
    { label: "Total Supporters", value: stats.supporters.toLocaleString(), change: "+12%", up: true, icon: Users, color: "indigo" },
    { label: "Monthly Revenue", value: `₹${stats.monthlyRevenue.toLocaleString()}`, change: "+8.2%", up: true, icon: IndianRupee, color: "emerald" },
    { label: "Page Views", value: stats.pageViews.toLocaleString(), change: "+23%", up: true, icon: Eye, color: "purple" },
    { label: "Active Posts", value: stats.posts.toLocaleString(), change: "+100%", up: true, icon: TrendingUp, color: "pink" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full animate-fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Insights</h1>
        <p className="text-gray-400">Track your growth, engagement, and revenue at a glance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {displayStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white/5 border border-white/10 rounded-3xl p-5 hover:border-white/20 transition-all hover:scale-[1.02] shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-green-400">
                  <ArrowUpRight size={14} />
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <h3 className="text-lg font-bold text-white mb-6">Revenue Trend</h3>
          <div className="h-56 pt-2">
            <InteractiveChart
              data={monthlyData}
              xKey="month"
              yKey="revenue"
              prefix="₹"
              gradientColors={["#6366f1", "#8b5cf6"]}
              strokeColor="#6366f1"
              chartType="area"
            />
          </div>
        </div>

        {/* Top Content */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Top Content</h3>
          {topContent.length > 0 ? (
            <div className="space-y-4">
              {topContent.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-sm font-bold text-indigo-400 w-5 mt-0.5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.views} views · {item.likes} likes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <FileText size={32} className="mb-2 opacity-45" />
              <p className="text-sm font-semibold">No content published</p>
              <p className="text-xs text-gray-600 text-center mt-1">Publish posts to start tracking viewer metrics.</p>
            </div>
          )}
        </div>
      </div>

      {/* Supporter Growth */}
      <div className="mt-6 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6">Supporter Growth</h3>
        <div className="h-56 pt-2">
          <InteractiveChart
            data={monthlyData}
            xKey="month"
            yKey="supporters"
            prefix=""
            gradientColors={["#10b981", "#14b8a6"]}
            strokeColor="#10b981"
            chartType="area"
          />
        </div>
      </div>
    </div>
  );
}
