import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { GlassCard } from "./components/GlassCard";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { currentMonitor } from "@tauri-apps/api/window";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Settings2, Terminal, Info, RefreshCw, CheckCircle, Save, Code, Plus, Settings, Cloud, Download, User, Globe, Trash2, Loader2, X } from "lucide-react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { cn } from "./lib/utils";
import { Dashboard } from "./components/Dashboard";
import { Library } from "./components/Library";
import { Customizer } from "./components/Customizer";
import { useEww } from "./hooks/useEww";
import { useWidgets } from "./hooks/useWidgets";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X } from "lucide-react";
import type { Widget } from "./types/widget";
import { debounce } from "./lib/debounce";
import * as commands from "./lib/commands";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [libraryView, setLibraryView] = useState<'local' | 'community'>('local');
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


  const { isEwwReady, monitorSize, isRestarting, restartEww } = useEww();
  const {
    widgets,
    setWidgets,
    initialGeometries,
    communityWidgets,
    isFetchingCommunity,
    fetchLocalWidgets,
    toggleWidget,
    fetchCommunityWidgets
  } = useWidgets();

  const handleCustomize = (widget: Widget) => {
    setSelectedWidget(widget);
    setActiveTab('customizer');
  };

  const handleDelete = (widget: Widget) => {
    if (selectedWidget?.id === widget.id) {
      setSelectedWidget(null);
      setActiveTab('library');
    }
  };

  const debouncedUpdateGeometry = debounce(async (yuck_path: string, geometry: Widget['geometry']) => {
    try {
      await commands.updateWidgetGeometry(
        yuck_path,
        geometry.x,
        geometry.y,
        geometry.width,
        geometry.height
      );
    } catch (err) {
      console.error("Failed to update geometry:", err);
    }
  }, 100);

  const updateGeometry = (widget: Widget, key: keyof Widget['geometry'], value: number) => {
    const newGeometry = { ...widget.geometry, [key]: value };
    setWidgets(prev => prev.map(w => w.id === widget.id ? { ...w, geometry: newGeometry } : w));
    if (selectedWidget?.id === widget.id) {
      setSelectedWidget({ ...selectedWidget, geometry: newGeometry });
    }
    debouncedUpdateGeometry(widget.yuck_path, newGeometry);
  };

  const resetGeometry = () => {
    if (!selectedWidget || !initialGeometries[selectedWidget.id]) return;
    const newGeometry = { ...initialGeometries[selectedWidget.id] };
    setWidgets(prev => prev.map(w => w.id === selectedWidget.id ? { ...w, geometry: newGeometry } : w));
    setSelectedWidget({ ...selectedWidget, geometry: newGeometry });
    debouncedUpdateGeometry(selectedWidget.yuck_path, newGeometry);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-10 overflow-y-auto custom-scrollbar" style={{ touchAction: 'pan-y' }}>
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <Dashboard
              widgets={widgets}
              isEwwReady={isEwwReady}
              isRestarting={isRestarting}
              restartEww={restartEww}
              toggleWidget={toggleWidget}
              onCustomize={handleCustomize}
              setMaximizedPreview={setMaximizedPreview}
            />
          )}

          {activeTab === "library" && (
            <Library
              widgets={widgets}
              communityWidgets={communityWidgets}
              isFetchingCommunity={isFetchingCommunity}
              libraryView={libraryView}
              setLibraryView={setLibraryView}
              fetchLocalWidgets={fetchLocalWidgets}
              fetchCommunityWidgets={fetchCommunityWidgets}
              onCustomize={handleCustomize}
              onDelete={handleDelete}
              setMaximizedPreview={setMaximizedPreview}
            />
          )}

          {activeTab === "customizer" && (
            <Customizer
              widgets={widgets}
              selectedWidget={selectedWidget}
              setSelectedWidget={setSelectedWidget}
              updateGeometry={updateGeometry}
              resetGeometry={resetGeometry}
              monitorSize={monitorSize}
            />
          )}

          {activeTab === "settings" && (
            <Settings
              isEwwRunning={isEwwRunning}
              isRestarting={isRestarting}
              restartEww={restartEww}
              killEww={killEww}
            />
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
