import { useRef } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Save } from "lucide-react";
import { GlassCard } from "./GlassCard";
import type { Widget } from "../types/widget";

export interface LivePreviewProps {
  selectedWidget: Widget | null;
  monitorSize: { width: number; height: number };
  isSavingGeometry: boolean;
  onSaveGeometry: () => void;
}

export function LivePreview({
  selectedWidget,
  monitorSize,
  isSavingGeometry,
  onSaveGeometry
}: LivePreviewProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);

  return (
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
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: `${100/12}% ${100/12}%`
          }}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onSaveGeometry}
          disabled={isSavingGeometry}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          {isSavingGeometry ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Geometry
        </button>
      </div>
    </GlassCard>
  );
}
