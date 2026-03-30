import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Code, ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { LivePreview } from "./LivePreview";
import { cn } from "../lib/utils";
import type { Widget } from "../types/widget";
import * as commands from "../lib/commands";

export interface CustomizerProps {
  widgets: Widget[];
  selectedWidget: Widget | null;
  setSelectedWidget: (widget: Widget | null) => void;
  updateGeometry: (widget: Widget, key: keyof Widget['geometry'], value: string | number) => void;
  resetGeometry: () => void;
  onSaveGeometry: (widget: Widget) => Promise<boolean>;
  liveUpdate: boolean;
  monitorSize: { width: number; height: number };
}

export function Customizer({
  widgets,
  selectedWidget,
  setSelectedWidget,
  updateGeometry,
  resetGeometry,
  onSaveGeometry,
  liveUpdate,
  monitorSize,
}: CustomizerProps) {
  const [yuckContent, setYuckContent] = useState("");
  const [scssContent, setScssContent] = useState("");
  const [variablesContent, setVariablesContent] = useState("");
  const [editorTab, setEditorTab] = useState<'yuck' | 'scss' | 'variables'>('yuck');

  const [isSavingGeometry, setIsSavingGeometry] = useState(false);
  const [isSavingYuck, setIsSavingYuck] = useState(false);
  const [isSavingScss, setIsSavingScss] = useState(false);
  const [isSavingVariables, setIsSavingVariables] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'visual' | 'manual'>('visual');


  useEffect(() => {
    if (selectedWidget) {
      const loadContent = async () => {
        try {
          // 1. Load Layout (Yuck)
          const yuck = await commands.readWidgetYuck(selectedWidget.yuck_path);
          setYuckContent(yuck);

          // 2. Load Styles (SCSS)
          if (selectedWidget.scss_path) {
            try {
              const scss = await commands.readWidgetYuck(selectedWidget.scss_path);
              setScssContent(scss);
            } catch (e) {
              console.log("Failed to load SCSS from explicit path:", e);
              setScssContent("");
            }
          } else {
            // Fallback for legacy widgets
            try {
              const scss = await commands.readWidgetScss(selectedWidget.yuck_path);
              setScssContent(scss);
            } catch (e) {
              setScssContent("");
            }
          }

          // 3. Load Variables
          if (selectedWidget.variables_path) {
            try {
              const vars = await commands.readWidgetYuck(selectedWidget.variables_path);
              setVariablesContent(vars);
            } catch (e) {
              console.log("Failed to load variables.yuck:", e);
              setVariablesContent("");
            }
          } else {
            setVariablesContent("");
          }

        } catch (err) {
          console.error("Failed to load widget content:", err);
        }
      };
      loadContent();
    } else {
      // Clear editor state when no widget is selected to avoid showing stale content
      setYuckContent("");
      setScssContent("");
      setVariablesContent("");
      setEditorTab("yuck");
    }
  }, [selectedWidget]);

  // Sync content when switching to manual mode to ensure code editor has latest changes
  useEffect(() => {
    if (activeMode === 'manual' && selectedWidget) {
      const refreshContent = async () => {
        try {
          const yuck = await commands.readWidgetYuck(selectedWidget.yuck_path);
          setYuckContent(yuck);

          if (selectedWidget.scss_path) {
            const scss = await commands.readWidgetYuck(selectedWidget.scss_path);
            setScssContent(scss);
          } else {
            const scss = await commands.readWidgetScss(selectedWidget.yuck_path);
            setScssContent(scss);
          }

          if (selectedWidget.variables_path) {
            const vars = await commands.readWidgetYuck(selectedWidget.variables_path);
            setVariablesContent(vars);
          }
        } catch (err) {
          console.error("Failed to sync content for manual mode:", err);
        }
      };
      refreshContent();
    }
  }, [activeMode, selectedWidget]);

  const saveGeometry = async () => {
    if (!selectedWidget) return;
    setIsSavingGeometry(true);
    const success = await onSaveGeometry(selectedWidget);
    setIsSavingGeometry(false);
    if (success) {
      // Optional: show toast
    }
  };

  const saveYuck = async () => {
    if (!selectedWidget) return;
    setIsSavingYuck(true);
    try {
      await commands.writeWidgetYuck(selectedWidget.yuck_path, yuckContent);
      setIsSavingYuck(false);

    } catch (err) {
      console.error("Failed to save yuck:", err);
      setIsSavingYuck(false);
    }
  };

  const saveScss = async () => {
    if (!selectedWidget) return;
    setIsSavingScss(true);
    try {
      if (selectedWidget.scss_path) {
        await commands.writeWidgetYuck(selectedWidget.scss_path, scssContent);
      } else {
        await commands.writeWidgetScss(selectedWidget.yuck_path, scssContent);
      }
      setIsSavingScss(false);
    } catch (err) {
      console.error("Failed to save scss:", err);
      setIsSavingScss(false);
    }
  };

  const saveVariables = async () => {
    if (!selectedWidget || !selectedWidget.variables_path) return;
    setIsSavingVariables(true);
    try {
      await commands.writeWidgetYuck(selectedWidget.variables_path, variablesContent);
      setIsSavingVariables(false);
    } catch (err) {
      console.error("Failed to save variables:", err);
      setIsSavingVariables(false);
    }
  };


  return (
    <motion.div
      key="customizer"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-4xl font-black tracking-tight mb-2 text-white">CUSTOMIZER</h1>
        <p className="text-white/40 font-medium">Fine-tune widget geometry and source code.</p>
      </header>

      <GlassCard className="overflow-visible z-50 w-full mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Select Widget & Mode</h3>
          <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">
            <RefreshCw className={cn("w-3 h-3", (isSavingGeometry || isSavingYuck || isSavingScss || isSavingVariables) && "animate-spin")} />
            {activeMode === 'visual' ? 'Tweaking Layout' : 'Editing Source'}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <button
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              className={cn(
                "w-full h-[60px] flex items-center justify-between px-4 py-3 rounded-xl transition-all border shadow-lg group",
                selectedWidget
                  ? "bg-blue-600 border-transparent text-white ring-4 ring-blue-600/10"
                  : "bg-[#2c2c2c] border-[#3d3d3d] text-gray-400"
              )}
            >
              <div className="flex flex-col items-start overflow-hidden text-left">
                <span className="font-black tracking-tight text-sm truncate w-full uppercase">
                  {selectedWidget ? selectedWidget.name : "SELECT A WIDGET"}
                </span>
                {selectedWidget && (
                  <span className="text-[10px] uppercase tracking-wider opacity-60 font-medium">
                    {selectedWidget.status}
                  </span>
                )}
              </div>
              {isSelectorOpen ? (
                <ChevronUp className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              ) : (
                <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
            </button>

            <AnimatePresence>
              {isSelectorOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 5, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#1e1e1e] border border-white/5 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] backdrop-blur-xl"
                >
                  <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {widgets.map(w => (
                      <button
                        key={w.id}
                        onClick={() => {
                          setSelectedWidget(w);
                          setIsSelectorOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-lg transition-all mb-1 last:mb-0 flex items-center justify-between group",
                          selectedWidget?.id === w.id
                            ? "bg-blue-500/10 text-blue-400"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{w.name}</span>
                          <span className="text-[9px] uppercase tracking-widest opacity-50">{w.status}</span>
                        </div>
                        {selectedWidget?.id === w.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex bg-[#121212] rounded-xl p-1 border border-[#2c2c2c] h-[60px] shrink-0">
            <button
              onClick={() => setActiveMode('visual')}
              className={cn(
                "px-6 rounded-lg text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1",
                activeMode === 'visual' ? "bg-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>VISUAL</span>
            </button>
            <button
              onClick={() => setActiveMode('manual')}
              className={cn(
                "px-6 rounded-lg text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1",
                activeMode === 'manual' ? "bg-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white"
              )}
            >
              <Code className="w-3.5 h-3.5" />
              <span>MANUAL</span>
            </button>
          </div>
        </div>
      </GlassCard>

            <div className="lg:col-span-2 space-y-6">
              <LivePreview
                selectedWidget={selectedWidget}
                monitorSize={monitorSize}
                isSavingGeometry={isSavingGeometry}
                onSaveGeometry={saveGeometry}
                liveUpdate={liveUpdate}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="manual-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <GlassCard className="flex flex-col min-h-[600px]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Source Editor</h3>
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
                    {selectedWidget?.variables_path && (
                      <button
                        onClick={() => setEditorTab('variables')}
                        className={cn(
                          "px-3 py-1 rounded-md text-[10px] font-black transition-all",
                          editorTab === 'variables' ? "bg-[#2563eb] text-white shadow-sm" : "text-gray-400 hover:text-white"
                        )}
                      >
                        VARS
                      </button>
                    )}
                  </div>
                </div>
                {/* <div className="flex justify-end"> */}
                <button
                  onClick={
                    editorTab === 'yuck' ? saveYuck :
                      editorTab === 'scss' ? saveScss :
                        saveVariables
                  }
                  disabled={
                    editorTab === 'yuck' ? isSavingYuck :
                      editorTab === 'scss' ? isSavingScss :
                        isSavingVariables
                  }
                  // className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50 h-9 shadow-lg border border-transparent"

                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-gray-300 border border-transparent px-4 py-1.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                  {(editorTab === 'yuck' ? isSavingYuck : editorTab === 'scss' ? isSavingScss : isSavingVariables) ?
                    <RefreshCw className="w-4 h-4 animate-spin" /> :
                    <Code className="w-4 h-4" />
                  }
                  Save {
                    editorTab === 'yuck' ? 'Source' :
                      editorTab === 'scss' ? 'Styles' :
                        'Variables'
                  }
                </button>
                {/* </div> */}
                {/* <div className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">
                  {editorTab.toUpperCase()}
                </div> */}
              </div>
              <div className="flex-1 relative font-mono">
                <textarea
                  value={editorTab === 'yuck' ? yuckContent : editorTab === 'scss' ? scssContent : variablesContent}
                  onChange={(e) => {
                    if (editorTab === 'yuck') setYuckContent(e.target.value);
                    else if (editorTab === 'scss') setScssContent(e.target.value);
                    else setVariablesContent(e.target.value);
                  }}
                  className="w-full h-full min-h-[500px] bg-[#121212] border border-[#2c2c2c] rounded-xl p-4 text-sm text-blue-100/80 outline-none focus:border-blue-600 transition-all resize-none custom-scrollbar"
                  placeholder={
                    editorTab === 'yuck' ? "; Widget code goes here..." :
                      editorTab === 'scss' ? "// Styles go here..." :
                        ";; Variables, polls, and listeners go here..."
                  }
                />
              </div>

            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
