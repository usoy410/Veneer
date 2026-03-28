import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { GlassCard } from "./components/GlassCard";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { currentMonitor } from "@tauri-apps/api/window";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Settings2, Terminal, Info, RefreshCw, CheckCircle, Save, Code, Plus, Settings, Cloud, Download, User, Globe, Trash2, Loader2, X } from "lucide-react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { cn } from "./lib/utils";
import { debounce } from "./lib/debounce";

interface Widget {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  description: string;
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  yuck_path: string;
  windows: string[];
  preview?: string;
}

interface CommunityWidget {
  id: string;
  name: string;
  description: string;
  author: string;
  download_url: string;
  preview_url: string;
  folder_name?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEwwReady, setIsEwwReady] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isRestarting, setIsRestarting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [monitorSize, setMonitorSize] = useState({ width: 1920, height: 1080 });
  const [yuckContent, setYuckContent] = useState("");
  const [scssContent, setScssContent] = useState("");
  const [isSavingGeometry, setIsSavingGeometry] = useState(false);
  const [isSavingYuck, setIsSavingYuck] = useState(false);
  const [isSavingScss, setIsSavingScss] = useState(false);
  const [editorTab, setEditorTab] = useState<'yuck' | 'scss'>('yuck');
  const [initialGeometries, setInitialGeometries] = useState<Record<string, Widget['geometry']>>({});
  const [libraryView, setLibraryView] = useState<'local' | 'community'>('local');
  const [communityWidgets, setCommunityWidgets] = useState<CommunityWidget[]>([]);
  const [isFetchingCommunity, setIsFetchingCommunity] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installingStep, setInstallingStep] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [maximizedPreview, setMaximizedPreview] = useState<string | null>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      // Get monitor size
      try {
        const monitor = await currentMonitor();
        if (monitor) {
          setMonitorSize({ 
            width: monitor.size.width / monitor.scaleFactor, 
            height: monitor.size.height / monitor.scaleFactor 
          });
        }
      } catch (err) {
        console.error("Failed to get monitor size:", err);
      }

      // Check eww status
      try {
        const ready = await invoke("check_eww");
        setIsEwwReady(ready as boolean);
      } catch (err) {
        console.error("Failed to check eww status:", err);
      }

      // Scan widgets
      try {
        const scannedWidgets = await invoke("scan_widgets") as Widget[];
        if (scannedWidgets && Array.isArray(scannedWidgets)) {
          setWidgets(scannedWidgets);

          // Store initial geometries for resetting
          const initials: Record<string, Widget['geometry']> = {};
          scannedWidgets.forEach(w => {
            if (w.id && w.geometry) {
              initials[w.id] = { ...w.geometry };
            }
          });
          setInitialGeometries(initials);
        }
      } catch (err) {
        console.error("Failed to scan widgets:", err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedWidget && activeTab === "customizer") {
      const loadContent = async () => {
        try {
          const yuck = await invoke("read_widget_yuck", { yuckPath: selectedWidget.yuck_path }) as string;
          setYuckContent(yuck);
          
          try {
             const scss = await invoke("read_widget_scss", { yuckPath: selectedWidget.yuck_path }) as string;
             setScssContent(scss);
          } catch (e) {
             console.log("No SCSS found or failed to load:", e);
             setScssContent("");
          }
        } catch (err) {
          console.error("Failed to load widget content:", err);
        }
      };
      loadContent();
    }
  }, [selectedWidget, activeTab]);

  const restartEww = async () => {
    setIsRestarting(true);
    try {
      await invoke("restart_eww");
      // Refresh status after restart
      const ready = await invoke("check_eww");
      setIsEwwReady(ready as boolean);
      setIsRestarting(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to restart Eww:", err);
      setIsRestarting(false);
    }
  };

  const toggleWidget = async (widget: Widget) => {
    const newStatus = widget.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'open' : 'close';

    // Ensure it's included in main eww.yuck if starting
    if (action === 'open') {
      try {
        await invoke("ensure_widget_linked", { name: widget.name, yuckPath: widget.yuck_path });
      } catch (err) {
        console.error("Failed to link widget:", err);
      }
    }

    // Use the first window name found in the yuck files
    const windowToToggle = widget.windows[0] || widget.name.toLowerCase().replace(/\s+/g, '-');

    try {
      await invoke("run_eww_command", { args: [action, windowToToggle] });
      setWidgets(prev => prev.map(w =>
        w.id === widget.id ? { ...w, status: newStatus } : w
      ));
    } catch (err) {
      console.error("Failed to toggle widget:", err);
    }
  };

  const debouncedUpdateGeometry = debounce(async (yuck_path: string, geometry: Widget['geometry']) => {
    try {
      await invoke("update_widget_geometry", {
        yuckPath: yuck_path,
        x: geometry.x,
        y: geometry.y,
        width: geometry.width,
        height: geometry.height
      });
    } catch (err) {
      console.error("Failed to update geometry:", err);
    }
  }, 100);

  const updateGeometry = (widget: Widget, key: keyof Widget['geometry'], value: number) => {
    const newGeometry = { ...widget.geometry, [key]: value };
    setWidgets(prev => prev.map(w =>
      w.id === widget.id ? { ...w, geometry: newGeometry } : w
    ));
    // Also update selectedWidget so the UI reflects it immediately
    if (selectedWidget?.id === widget.id) {
      setSelectedWidget({ ...selectedWidget, geometry: newGeometry });
    }

    debouncedUpdateGeometry(widget.yuck_path, newGeometry);
  };

  const resetGeometry = () => {
    if (!selectedWidget || !initialGeometries[selectedWidget.id]) return;
    const newGeometry = { ...initialGeometries[selectedWidget.id] };
    setWidgets(prev => prev.map(w =>
      w.id === selectedWidget.id ? { ...w, geometry: newGeometry } : w
    ));
    setSelectedWidget({ ...selectedWidget, geometry: newGeometry });
    debouncedUpdateGeometry(selectedWidget.yuck_path, newGeometry);
  };

  const saveGeometry = async () => {
    if (!selectedWidget) return;
    setIsSavingGeometry(true);
    try {
      await invoke("update_widget_geometry", {
        yuckPath: selectedWidget.yuck_path,
        x: selectedWidget.geometry.x,
        y: selectedWidget.geometry.y,
        width: selectedWidget.geometry.width,
        height: selectedWidget.geometry.height
      });
      setIsSavingGeometry(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to save geometry:", err);
      setIsSavingGeometry(false);
    }
  };

  const saveYuck = async () => {
    if (!selectedWidget) return;
    setIsSavingYuck(true);
    try {
      await invoke("write_widget_yuck", {
        yuckPath: selectedWidget.yuck_path,
        content: yuckContent
      });
      setIsSavingYuck(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to save yuck:", err);
      setIsSavingYuck(false);
    }
  };

  const saveScss = async () => {
    if (!selectedWidget) return;
    setIsSavingScss(true);
    try {
      await invoke("write_widget_scss", { 
        yuckPath: selectedWidget.yuck_path,
        content: scssContent
      });
      setIsSavingScss(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to save scss:", err);
      setIsSavingScss(false);
    }
  };

  const uploadWidget = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: 'Select Widget Folder'
      });

      if (selected && typeof selected === 'string') {
        await invoke('upload_widget', { sourcePath: selected });
        // Refresh widgets list
        const scannedWidgets = await invoke("scan_widgets") as Widget[];
        setWidgets(scannedWidgets);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to upload widget:", err);
    }
  };

  const fetchCommunityWidgets = async () => {
    setIsFetchingCommunity(true);
    try {
      const result = await invoke("fetch_community_widgets") as CommunityWidget[];
      setCommunityWidgets(result);
    } catch (err) {
      console.error("Failed to fetch community widgets:", err);
    } finally {
      setIsFetchingCommunity(false);
    }
  };

  const installCommunityWidget = async (widget: CommunityWidget) => {
    setInstallingId(widget.id);
    setInstallingStep("Downloading...");
    try {
      await invoke("install_community_widget", { 
        downloadUrl: widget.download_url,
        folderName: widget.folder_name || null
      });
      
      setInstallingStep("Finalizing...");
      // Refresh local widgets
      const scannedWidgets = await invoke("scan_widgets") as Widget[];
      setWidgets(scannedWidgets);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setLibraryView('local'); // Switch back to see the new widget
    } catch (err) {
      console.error("Failed to install widget:", err);
      alert(`Installation failed: ${err}`);
    } finally {
      setInstallingId(null);
      setInstallingStep(null);
    }
  };

  const deleteWidget = async (widget: Widget) => {
    if (!confirm(`Are you sure you want to delete "${widget.name}"? This will remove all files for this widget.`)) {
      return;
    }

    setIsDeleting(widget.id);
    try {
      await invoke("delete_widget", { widgetName: widget.name });
      
      // Refresh local widgets
      const scannedWidgets = await invoke("scan_widgets") as Widget[];
      setWidgets(scannedWidgets);
      
      if (selectedWidget?.id === widget.id) {
        setSelectedWidget(null);
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to delete widget:", err);
      alert(`Deletion failed: ${err}`);
    } finally {
      setIsDeleting(null);
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

    const url = `https://github.com/usoy410/Veneer/issues/new?title=Widget+Submission:+${widget.name}&body=${body}`;
    try {
      await openUrl(url);
    } catch (err) {
      console.error("Failed to open submission URL:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'library' && libraryView === 'community' && communityWidgets.length === 0) {
      fetchCommunityWidgets();
    }
  }, [activeTab, libraryView]);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-10 overflow-y-auto custom-scrollbar" style={{ touchAction: 'pan-y' }}>
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
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
                    onClick={restartEww}
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
                          onClick={() => toggleWidget(widget)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${widget.status === 'active'
                              ? 'bg-blue-600 text-white border-transparent shadow-sm'
                              : 'bg-[#2c2c2c] text-gray-400 border-transparent'
                            }`}>
                          {widget.status}
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{widget.name}</h3>
                    <p className="text-sm text-white/40 mb-6 leading-relaxed">{widget.description}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleWidget(widget)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
                      >
                        {widget.status === 'active' ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                        {widget.status === 'active' ? 'Stop' : 'Start'}
                      </button>
                      <button
                        onClick={() => { setSelectedWidget(widget); setActiveTab('customizer'); }}
                        className="w-12 h-12 bg-[#2c2c2c] hover:bg-[#3d3d3d] rounded-xl flex items-center justify-center border border-transparent transition-all"
                        title="Customize"
                      >
                        <Settings2 className="w-5 h-5 text-white/60" />
                      </button>
                      <button
                        onClick={() => submitWidget(widget)}
                        className="w-12 h-12 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30 transition-all group"
                        title="Submit to Community"
                      >
                        <Cloud className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "library" && (
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
                            onClick={() => { setSelectedWidget(widget); setActiveTab('customizer'); }}
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
                          <button
                            onClick={() => installCommunityWidget(widget)}
                            disabled={installingId === widget.id}
                            className={cn(
                              "w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50",
                              installingId === widget.id 
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-blue-600 hover:bg-blue-500 text-white"
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
                        </GlassCard>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "customizer" && (
            <motion.div
              key="customizer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header>
                <h1 className="text-4xl font-black tracking-tight mb-2 text-white">CUSTOMIZER</h1>
                <p className="text-white/40 font-medium">Fine-tune widget geometry and appearance.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <GlassCard>
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6">Select Widget</h3>
                    <div className="space-y-2">
                      {widgets.map(w => (
                        <button
                          key={w.id}
                          onClick={() => setSelectedWidget(w)}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl transition-all border",
                            selectedWidget?.id === w.id
                              ? "bg-blue-600 border-transparent text-white"
                              : "bg-[#2c2c2c] border-transparent text-gray-400 hover:bg-[#3d3d3d] hover:text-white"
                          )}
                        >
                          <div className="font-bold">{w.name}</div>
                          <div className="text-[10px] uppercase tracking-wider opacity-60 mt-1">{w.status}</div>
                        </button>
                      ))}
                    </div>
                  </GlassCard>

                  {selectedWidget && (
                    <GlassCard>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Geometry</h3>
                        <button
                          onClick={resetGeometry}
                          className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Reset
                        </button>
                      </div>
                      <div className="space-y-6">
                        {(['x', 'y', 'width', 'height'] as const).map(key => (
                          <div key={key}>
                            <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest italic opacity-60">
                              <span>{key}</span>
                              <span className="text-blue-400">{selectedWidget.geometry[key]}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={key === 'x' || key === 'width' ? monitorSize.width : monitorSize.height}
                              value={selectedWidget.geometry[key]}
                              onChange={(e) => updateGeometry(selectedWidget, key, parseInt(e.target.value))}
                              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )}
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <GlassCard className="flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Live Preview</h3>
                    </div>
                    <div
                      ref={constraintsRef}
                      className="aspect-video rounded-xl bg-[#121212] relative overflow-hidden pattern-dots shadow-sm"
                    >
                      {selectedWidget && (
                        <motion.div
                          style={{
                            left: `${(selectedWidget.geometry.x / monitorSize.width) * 100}%`,
                            top: `${(selectedWidget.geometry.y / monitorSize.height) * 100}%`,
                            width: `${(selectedWidget.geometry.width / monitorSize.width) * 100}%`,
                            height: `${(selectedWidget.geometry.height / monitorSize.height) * 100}%`,
                          }}
                          className="absolute bg-blue-500/20 border-2 border-blue-500/50 rounded-lg flex items-center justify-center backdrop-blur-sm cursor-default group"
                        >
                          <span className="text-[10px] font-black italic opacity-60 group-hover:opacity-100 transition-opacity">WIDGET AREA</span>
                        </motion.div>
                      )}

                      {/* Grid overlay for aesthetic */}
                      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-5">
                        {Array.from({ length: 144 }).map((_, i) => (
                          <div key={i} className="border-[0.5px] border-white/20" />
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={saveGeometry}
                        disabled={isSavingGeometry}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isSavingGeometry ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Geometry
                      </button>
                    </div>
                  </GlassCard>

                  <GlassCard className="flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Direct Edit</h3>
                        <div className="flex bg-[#121212] rounded-lg p-1 border border-[#2c2c2c]">
                          <button 
                            onClick={() => setEditorTab('yuck')}
                            className={cn(
                              "px-3 py-1 rounded-md text-[10px] font-black transition-all",
                              editorTab === 'yuck' ? "bg-[#2563eb] text-white shadow-sm" : "text-gray-400 hover:text-white"
                            )}
                          >
                            .YUCK
                          </button>
                          <button 
                            onClick={() => setEditorTab('scss')}
                            className={cn(
                              "px-3 py-1 rounded-md text-[10px] font-black transition-all",
                              editorTab === 'scss' ? "bg-[#2563eb] text-white shadow-sm" : "text-gray-400 hover:text-white"
                            )}
                          >
                            .SCSS
                          </button>
                        </div>
                      </div>
                      <div className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">
                        Direct Edit
                      </div>
                    </div>
                    <div className="flex-1 min-h-[300px] relative font-mono">
                      <textarea
                        value={editorTab === 'yuck' ? yuckContent : scssContent}
                        onChange={(e) => editorTab === 'yuck' ? setYuckContent(e.target.value) : setScssContent(e.target.value)}
                        className="w-full h-full min-h-[300px] bg-[#121212] border border-[#2c2c2c] rounded-xl p-4 text-sm text-blue-100/80 outline-none focus:border-blue-600 transition-all resize-none custom-scrollbar"
                        placeholder={editorTab === 'yuck' ? "; Widget code goes here..." : "// Styles go here..."}
                      />
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={editorTab === 'yuck' ? saveYuck : saveScss}
                        disabled={editorTab === 'yuck' ? isSavingYuck : isSavingScss}
                        className="flex items-center gap-2 bg-[#2c2c2c] hover:bg-[#3d3d3d] text-gray-300 border border-transparent px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
                      >
                        { (editorTab === 'yuck' ? isSavingYuck : isSavingScss) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Code className="w-4 h-4" />}
                        Save {editorTab === 'yuck' ? 'Source' : 'Styles'}
                      </button>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex justify-between items-center">
                <div>
                  <h1 className="text-4xl font-black tracking-tight mb-2 text-white uppercase">Settings</h1>
                  <p className="text-white/40 font-medium">Configure your widget manager experience.</p>
                </div>
                <Settings className="w-10 h-10 text-white/10 animate-[spin_10s_linear_infinite]" />
              </header>

              <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-2xl">Coming Soon</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {maximizedPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMaximizedPreview(null)}
              className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#121212]/90 cursor-zoom-out"
            >
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => setMaximizedPreview(null)}
                className="absolute top-8 right-8 w-12 h-12 bg-[#2c2c2c] hover:bg-[#3d3d3d] rounded-full flex items-center justify-center border-transparent transition-all z-[110]"
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>

              <motion.img
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                src={maximizedPreview}
                alt="Maximized preview"
                className="max-w-full max-h-full rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
