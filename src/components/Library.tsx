import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal, Globe, Plus, Trash2, RefreshCw, Loader2, Download, User, Code, Settings2, CheckCircle } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open as openDialog, ask } from "@tauri-apps/plugin-dialog";
import { cn } from "../lib/utils";
import type { Widget, CommunityWidget } from "../types/widget";
import * as commands from "../lib/commands";

export interface LibraryProps {
  widgets: Widget[];
  communityWidgets: CommunityWidget[];
  isFetchingCommunity: boolean;
  libraryView: 'local' | 'community';
  setLibraryView: (view: 'local' | 'community') => void;
  fetchLocalWidgets: () => void;
  fetchCommunityWidgets: () => void;
  onCustomize: (widget: Widget) => void;
  onDelete: (widget: Widget) => void;
  setMaximizedPreview: (url: string | null) => void;
}

export function Library({
  widgets,
  communityWidgets,
  isFetchingCommunity,
  libraryView,
  setLibraryView,
  fetchLocalWidgets,
  fetchCommunityWidgets,
  onCustomize,
  onDelete,
  setMaximizedPreview
}: LibraryProps) {
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installingStep, setInstallingStep] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);


  useEffect(() => {
    if (libraryView === 'community' && communityWidgets.length === 0) {
      fetchCommunityWidgets();
    }
  }, [libraryView]);

  const uploadWidget = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: 'Select Widget Folder'
      });

      if (selected && typeof selected === 'string') {
        await commands.uploadWidget(selected);
        fetchLocalWidgets();

      }
    } catch (err) {
      console.error("Failed to upload widget:", err);
    }
  };

  const installCommunityWidget = async (widget: CommunityWidget) => {
    setInstallingId(widget.id);
    setInstallingStep("Downloading...");
    try {
      await commands.installCommunityWidget(widget.download_url, widget.folder_name || null);
      setInstallingStep("Finalizing...");
      fetchLocalWidgets();

      setLibraryView('local');
    } catch (err) {
      console.error("Failed to install widget:", err);
      alert(`Installation failed: ${err}`);
    } finally {
      setInstallingId(null);
      setInstallingStep(null);
    }
  };

  const deleteWidget = async (widget: Widget) => {
    const confirmed = await ask(
      `Are you sure you want to delete "${widget.name}"? This will remove all files for this widget.`,
      { title: 'Confirm Deletion', kind: 'warning' }
    );

    if (!confirmed) return;

    setIsDeleting(widget.id);
    try {
      await commands.deleteWidget(widget.name);
      fetchLocalWidgets();
      onDelete(widget);
    } catch (err) {
      console.error("Failed to delete widget:", err);
      alert(`Deletion failed: ${err}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <motion.div
      key="library"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 text-white uppercase">Library</h1>
          <p className="text-white/40 font-medium">Manage your custom widget collection.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-[#1e1e1e] rounded-xl p-1 border border-[#2c2c2c]">
            <button 
              onClick={() => setLibraryView('local')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                libraryView === 'local' ? "bg-[#2c2c2c] text-white shadow-sm" : "text-gray-400 hover:text-white"
              )}
            >
              <Terminal className="w-4 h-4" />
              Local
            </button>
            <button 
              onClick={() => setLibraryView('community')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                libraryView === 'community' ? "bg-[#2c2c2c] text-white shadow-sm" : "text-gray-400 hover:text-white"
              )}
            >
              <Globe className="w-4 h-4" />
              Community
            </button>
          </div>
          <button
            onClick={uploadWidget}
            className="w-12 h-12 bg-[#2c2c2c] hover:bg-[#3d3d3d] rounded-xl flex items-center justify-center border-transparent transition-all group"
            title="Upload Widget"
          >
            <Plus className="w-5 h-5 text-white/60 group-hover:text-white" />
          </button>
        </div>
      </header>

      {libraryView === 'local' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.length > 0 ? (
            widgets.map((widget, i) => (
              <GlassCard key={widget.id} delay={i * 0.1}>
                <div className="relative h-48 bg-[#121212] overflow-hidden rounded-xl mb-4 shadow-sm">
                  {widget.preview ? (
                    <img 
                      src={convertFileSrc(widget.preview)} 
                      alt={widget.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-zoom-in"
                      onClick={() => setMaximizedPreview(convertFileSrc(widget.preview!))}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center border-b border-white/5 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                      <Terminal className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{widget.name}</h3>
                <p className="text-sm text-white/40 mb-6 line-clamp-2">{widget.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onCustomize(widget)}
                    className="flex-1 bg-[#2c2c2c] hover:bg-[#3d3d3d] text-gray-300 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border-transparent"
                  >
                    <Settings2 className="w-4 h-4" />
                    Customize
                  </button>
                  <button
                    onClick={() => deleteWidget(widget)}
                    className="w-12 h-12 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center border border-red-500/30 transition-all group"
                    title="Delete Widget"
                    disabled={isDeleting === widget.id}
                  >
                    {isDeleting === widget.id ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                </div>
              </GlassCard>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center h-40 text-center">
              <p className="text-white/20 font-black italic uppercase tracking-widest text-xl">No local widgets found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {isFetchingCommunity ? (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-blue-500 animate-spin" />
                <Globe className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg mb-1">Fetching Community Widgets</p>
                <p className="text-white/40 text-sm animate-pulse">Checking for the latest updates...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityWidgets.map((widget, i) => (
                <GlassCard key={widget.id} delay={i * 0.1}>
                  <div className="aspect-video rounded-xl bg-[#121212] mb-4 overflow-hidden group relative shadow-sm">
                    {widget.preview_url ? (
                      <img 
                        src={widget.preview_url} 
                        alt={widget.name} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-zoom-in" 
                        onClick={() => setMaximizedPreview(widget.preview_url)}
                      />
                    ) : (
                      <div className="relative h-40 bg-[#121212] overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center bg-[#18181b]">
                          <Code className="w-10 h-10 text-white/20" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-[#1e1e1e] px-2 py-1 rounded text-[10px] font-black text-gray-300 flex items-center gap-1 shadow-sm border border-[#2c2c2c]">
                      <User className="w-3 h-3" />
                      {widget.author}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{widget.name}</h3>
                  <p className="text-sm text-white/40 mb-6 line-clamp-2">{widget.description}</p>
                  <div className="flex gap-2 h-10">
                    {widgets.some(w => w.id === widget.id || (widget.folder_name && w.name === widget.folder_name)) ? (
                      <div className="w-full bg-[#1e1e1e] text-gray-500 rounded-xl font-bold flex items-center justify-center gap-2 border border-white/5 cursor-default">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Installed
                      </div>
                    ) : (
                      <button
                        onClick={() => installCommunityWidget(widget)}
                        disabled={installingId === widget.id}
                        className={cn(
                          "w-full rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50",
                          installingId === widget.id 
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                        )}
                      >
                        {installingId === widget.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {installingStep}
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Install Widget
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
