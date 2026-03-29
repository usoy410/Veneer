import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, CheckCircle, Info, Terminal, Play, Square, Settings2, Cloud, Loader2 } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { GlassCard } from "./GlassCard";
import { cn } from "../lib/utils";
import type { Widget } from "../types/widget";

export interface DashboardProps {
  widgets: Widget[];
  isEwwReady: boolean;
  isRestarting: boolean;
  restartEww: () => Promise<boolean>;
  toggleWidget: (widget: Widget) => Promise<boolean>;
  onCustomize: (widget: Widget) => void;
  setMaximizedPreview: (url: string | null) => void;
}

export function Dashboard({
  widgets,
  isEwwReady,
  isRestarting,
  restartEww,
  toggleWidget,
  onCustomize,
  setMaximizedPreview,
}: DashboardProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingWidgets, setLoadingWidgets] = useState<Record<string, boolean>>({});

  const handleToggleWidget = async (widget: Widget) => {
    setLoadingWidgets(prev => ({ ...prev, [widget.id]: true }));
    try {
      await toggleWidget(widget);
    } finally {
      setLoadingWidgets(prev => ({ ...prev, [widget.id]: false }));
    }
  };

  const handleRestart = async () => {
    const success = await restartEww();
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const submitWidget = async (widget: Widget) => {
    const registrySnippet = {
      id: widget.id,
      name: widget.name,
      description: widget.description,
      author: "YourName",
      download_url: "https://github.com/your-username/your-repo/archive/refs/heads/main.zip",
      preview_url: "https://raw.githubusercontent.com/your-username/your-repo/main/preview.png"
    };

    const body = encodeURIComponent(
      `## Widget Submission\n\n` +
      `Please add my widget to the registry!\n\n` +
      `\`\`\`json\n${JSON.stringify(registrySnippet, null, 2)}\n\`\`\`\n\n` +
      `**IMPORTANT:** Please provide a valid \`preview_url\` (direct link to a screenshot) so users can see what they're installing!`
    );

    const title = encodeURIComponent(`Widget Submission: ${widget.name}`);
    const url = `https://github.com/usoy410/Veneer/issues/new?title=${title}&body=${body}`;
    try {
      await openUrl(url);
    } catch (err) {
      console.error("Failed to open submission URL:", err);
    }
  };

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 text-white">DASHBOARD</h1>
          <p className="text-white/40 font-medium">Manage and monitor your active widgets.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleRestart}
            disabled={isRestarting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all active:scale-95 disabled:opacity-50",
              showSuccess
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-[#1e1e1e] hover:bg-[#2c2c2c] text-gray-300 border border-[#2c2c2c]"
            )}
          >
            {isRestarting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : showSuccess ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRestarting ? "Restarting..." : showSuccess ? "Restarted!" : "Restart Daemon"}
          </button>
          {!isEwwReady && (
            <div className="flex items-center gap-2 bg-orange-500/10 text-orange-400 px-4 py-2 rounded-xl border border-orange-500/20">
              <Info className="w-4 h-4" />
              <span className="text-sm font-bold">Eww is not installed or configured.</span>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {widgets.map((widget, i) => (
          <GlassCard key={widget.id} delay={i * 0.1}>
            <div className="relative h-48 bg-[#121212] overflow-hidden rounded-xl mb-4 group shadow-sm">
              {widget.preview ? (
                <img 
                  src={convertFileSrc(widget.preview)} 
                  alt={widget.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-zoom-in"
                  onClick={() => setMaximizedPreview(convertFileSrc(widget.preview!))}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#18181b]">
                  <Terminal className="w-12 h-12 text-white/20" />
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => handleToggleWidget(widget)}
                  disabled={loadingWidgets[widget.id]}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-1 ${widget.status === 'active'
                      ? 'bg-blue-600 text-white border-transparent shadow-sm'
                      : 'bg-[#2c2c2c] text-gray-400 border-transparent'
                    } disabled:opacity-75 disabled:cursor-not-allowed`}>
                  {loadingWidgets[widget.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {widget.status}
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">{widget.name}</h3>
            <p className="text-sm text-white/40 mb-6 leading-relaxed">{widget.description}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleWidget(widget)}
                disabled={loadingWidgets[widget.id]}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loadingWidgets[widget.id] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : widget.status === 'active' ? (
                  <Square className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                {loadingWidgets[widget.id] ? (widget.status === 'active' ? 'Stopping...' : 'Starting...') : (widget.status === 'active' ? 'Stop' : 'Start')}
              </button>
              <button
                onClick={() => onCustomize(widget)}
                className="w-12 h-12 bg-[#2c2c2c] hover:bg-[#3d3d3d] rounded-xl flex items-center justify-center border border-transparent transition-all"
                title="Customize"
              >
                <Settings2 className="w-5 h-5 text-white/60" />
              </button>
              {!widget.is_community && (
                <button
                  onClick={() => submitWidget(widget)}
                  className="w-12 h-12 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30 transition-all group"
                  title="Submit to Community"
                >
                  <Cloud className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );
}
