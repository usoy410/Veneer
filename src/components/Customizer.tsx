import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Code } from "lucide-react";
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
  monitorSize: { width: number; height: number };
}

export function Customizer({
  widgets,
  selectedWidget,
  setSelectedWidget,
  updateGeometry,
  resetGeometry,
  monitorSize,
}: CustomizerProps) {
  const [yuckContent, setYuckContent] = useState("");
  const [scssContent, setScssContent] = useState("");
  const [editorTab, setEditorTab] = useState<'yuck' | 'scss'>('yuck');
  
  const [isSavingGeometry, setIsSavingGeometry] = useState(false);
  const [isSavingYuck, setIsSavingYuck] = useState(false);
  const [isSavingScss, setIsSavingScss] = useState(false);


  useEffect(() => {
    if (selectedWidget) {
      const loadContent = async () => {
        try {
          const yuck = await commands.readWidgetYuck(selectedWidget.yuck_path);
          setYuckContent(yuck);
          
          try {
             const scss = await commands.readWidgetScss(selectedWidget.yuck_path);
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
  }, [selectedWidget]);

  const saveGeometry = async () => {
    if (!selectedWidget) return;
    setIsSavingGeometry(true);
    try {
      await commands.updateWidgetGeometry(
        selectedWidget.yuck_path,
        selectedWidget.geometry.x,
        selectedWidget.geometry.y,
        selectedWidget.geometry.width,
        selectedWidget.geometry.height
      );
      setIsSavingGeometry(false);

    } catch (err) {
      console.error("Failed to save geometry:", err);
      setIsSavingGeometry(false);
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
      await commands.writeWidgetScss(selectedWidget.yuck_path, scssContent);
      setIsSavingScss(false);

    } catch (err) {
      console.error("Failed to save scss:", err);
      setIsSavingScss(false);
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
          <LivePreview
            selectedWidget={selectedWidget}
            monitorSize={monitorSize}
            isSavingGeometry={isSavingGeometry}
            onSaveGeometry={saveGeometry}
          />

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
  );
}
