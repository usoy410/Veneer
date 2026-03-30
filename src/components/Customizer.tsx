import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Code, ChevronDown, ChevronUp, LayoutGrid, Type, Palette } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { LivePreview } from "./LivePreview";
import { cn } from "../lib/utils";
import type { Widget } from "../types/widget";
import * as commands from "../lib/commands";

export interface CustomizerProps {
  widgets: Widget[];
  selectedWidget: Widget | null;
  setSelectedWidget: (widget: Widget | null) => void;
  updateGeometry: (widget: Widget, key: keyof Widget['geometry'], value: number) => void;
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
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'visual' | 'manual'>('visual');

  const [allClasses, setAllClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classStyles, setClassStyles] = useState<Record<string, { fontSize: number; color: string }>>({});


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

          // 3. Load Classes and Appearance
          const classes = await commands.getWidgetClasses(selectedWidget.yuck_path);
          setAllClasses(classes);
          if (classes.length > 0) {
            setSelectedClass(classes[0]);
          } else {
            setSelectedClass("window");
            setAllClasses(["window"]);
          }

          const scss = selectedWidget.scss_path 
            ? await commands.readWidgetYuck(selectedWidget.scss_path)
            : await commands.readWidgetScss(selectedWidget.yuck_path);

          const newStyles: Record<string, { fontSize: number; color: string }> = {};
          
          // Default styles for all classes
          const baseClasses = classes.length > 0 ? classes : ["window"];
          baseClasses.forEach(c => {
            newStyles[c] = { fontSize: 16, color: "#ffffff" };
          });

          // Extract current appearance from SCSS if VENEER_CUSTOM_STYLES block exists
          const customBlockMatch = scss.match(/\/\* VENEER_CUSTOM_STYLES \*\/([\s\S]*?)\/\* END_VENEER_CUSTOM_STYLES \*\//);
          if (customBlockMatch) {
            const blockContent = customBlockMatch[1];
            baseClasses.forEach(c => {
              const classRegex = new RegExp(`\\.${c}\\s*\\{[^}]*font-size:\\s*(\\d+)px(?:;[^}]*|[^}]*)color:\\s*(#[0-9a-fA-F]{3,6})`);
              const match = blockContent.match(classRegex);
              if (match) {
                newStyles[c] = {
                  fontSize: parseInt(match[1]),
                  color: match[2]
                };
              } else {
                // Try individual matches if the joined one fails
                const fontSizeMatch = blockContent.match(new RegExp(`\\.${c}[^{]*\\{[^}]*font-size:\\s*(\\d+)px`));
                const colorMatch = blockContent.match(new RegExp(`\\.${c}[^{]*\\{[^}]*color:\\s*(#[0-9a-fA-F]{3,6})`));
                if (fontSizeMatch) newStyles[c].fontSize = parseInt(fontSizeMatch[1]);
                if (colorMatch) newStyles[c].color = colorMatch[1];
              }
            });
          }
          
          setClassStyles(newStyles);

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
      setAllClasses([]);
      setSelectedClass("");
      setClassStyles({});
    }
  }, [selectedWidget]);

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

  const saveAppearance = async () => {
    if (!selectedWidget) return;
    setIsSavingAppearance(true);
    try {
      const stylesPayload = Object.entries(classStyles).map(([cls, style]) => ({
        class: cls,
        font_size: style.fontSize,
        color: style.color
      }));

      await commands.updateWidgetAppearance(
        selectedWidget.yuck_path,
        selectedWidget.scss_path || null,
        stylesPayload
      );
      
      // Refresh SCSS content in editor to reflect changes
      const updatedScss = selectedWidget.scss_path 
        ? await commands.readWidgetYuck(selectedWidget.scss_path)
        : await commands.readWidgetScss(selectedWidget.yuck_path);
      setScssContent(updatedScss);
      
      setIsSavingAppearance(false);
    } catch (err) {
      console.error("Failed to save appearance:", err);
      setIsSavingAppearance(false);
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
        <p className="text-white/40 font-medium">Fine-tune widget geometry and appearance.</p>
      </header>

      <GlassCard className="overflow-visible z-50 w-full mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Select Widget & Mode</h3>
          <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">
            <RefreshCw className={cn("w-3 h-3", (isSavingGeometry || isSavingYuck || isSavingScss || isSavingAppearance) && "animate-spin")} />
            {activeMode === 'visual' ? 'Customizing' : 'Editing'}
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

      <AnimatePresence mode="wait">
        {activeMode === 'visual' ? (
          <motion.div
            key="visual-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-1 space-y-6">

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

          {selectedWidget && (
            <GlassCard>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Appearance</h3>
                <div className="flex items-center gap-1.5 opacity-40">
                  <Palette className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="space-y-8">
                {/* Class Selector */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">
                    Target Element
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2c2c2c] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-600 appearance-none cursor-pointer"
                  >
                    {allClasses.map(cls => (
                      <option key={cls} value={cls}>.{cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-3 uppercase tracking-widest italic opacity-60 items-center">
                    <div className="flex items-center gap-2">
                      <Type className="w-3 h-3 text-blue-400" />
                      <span>Font Size</span>
                    </div>
                    <span className="text-blue-400">{classStyles[selectedClass]?.fontSize || 16}px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="120"
                    value={classStyles[selectedClass]?.fontSize || 16}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value);
                      setClassStyles(prev => ({
                        ...prev,
                        [selectedClass]: { ...prev[selectedClass], fontSize: newSize }
                      }));
                    }}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-3 uppercase tracking-widest italic opacity-60 items-center">
                    <div className="flex items-center gap-2">
                        <Palette className="w-3 h-3 text-blue-400" />
                        <span>Text Color</span>
                    </div>
                    <span className="text-blue-400 font-mono">{(classStyles[selectedClass]?.color || "#FFFFFF").toUpperCase()}</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div 
                      className="w-10 h-10 rounded-xl border border-white/10 shadow-lg shrink-0" 
                      style={{ backgroundColor: classStyles[selectedClass]?.color || "#ffffff" }}
                    />
                    <input
                      type="color"
                      value={classStyles[selectedClass]?.color || "#ffffff"}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setClassStyles(prev => ({
                          ...prev,
                          [selectedClass]: { ...prev[selectedClass], color: newColor }
                        }));
                      }}
                      className="flex-1 h-10 bg-white/5 border border-white/10 rounded-xl px-1 py-1 cursor-pointer appearance-none block"
                    />
                  </div>
                </div>

                <button
                  onClick={saveAppearance}
                  disabled={isSavingAppearance}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 border",
                    isSavingAppearance 
                      ? "bg-white/5 border-white/5 text-white/20" 
                      : "bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20 hover:border-blue-500/40"
                  )}
                >
                  {isSavingAppearance ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Palette className="w-4 h-4" />
                      Apply Appearance
                    </>
                  )}
                </button>
              </div>
            </GlassCard>
          )}
        </div>

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
                <div className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">
                  {editorTab.toUpperCase()}
                </div>
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
              <div className="mt-6 flex justify-end">
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
                  className="flex items-center gap-2 bg-[#2c2c2c] hover:bg-[#3d3d3d] text-gray-300 border border-transparent px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                  { (editorTab === 'yuck' ? isSavingYuck : editorTab === 'scss' ? isSavingScss : isSavingVariables) ? 
                    <RefreshCw className="w-4 h-4 animate-spin" /> : 
                    <Code className="w-4 h-4" /> 
                  }
                  Save {
                    editorTab === 'yuck' ? 'Source' : 
                    editorTab === 'scss' ? 'Styles' : 
                    'Variables'
                  }
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
