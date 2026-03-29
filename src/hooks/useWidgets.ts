import { useState } from "react";
import type { Widget, CommunityWidget } from "../types/widget";
import * as commands from "../lib/commands";

export function useWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [initialGeometries, setInitialGeometries] = useState<Record<string, Widget['geometry']>>({});
  const [communityWidgets, setCommunityWidgets] = useState<CommunityWidget[]>([]);
  const [isFetchingCommunity, setIsFetchingCommunity] = useState(false);

  const fetchLocalWidgets = async (restoreSession = false) => {
    try {
      const scannedWidgets = await commands.scanWidgets() as unknown as Widget[];
      if (scannedWidgets && Array.isArray(scannedWidgets)) {
        let finalWidgets = scannedWidgets;
        
        if (restoreSession) {
          const activeIds = await commands.loadActiveWidgets();
          finalWidgets = scannedWidgets.map(w => ({
            ...w,
            status: activeIds.includes(w.id) ? 'active' : 'inactive'
          }));

          // Actually open the windows for active widgets
          for (const widget of finalWidgets) {
            if (widget.status === 'active') {
               const windowToOpen = widget.windows[0] || widget.name.toLowerCase().replace(/\s+/g, '-');
               try {
                 await commands.ensureWidgetLinked(widget.name, widget.yuck_path);
                 await commands.runEwwCommand(['open', windowToOpen]);
               } catch (e) {
                 console.error(`Failed to restore widget ${widget.name}:`, e);
               }
            }
          }
        }

        setWidgets(finalWidgets);
        const initials: Record<string, Widget['geometry']> = {};
        finalWidgets.forEach(w => {
          if (w.id && w.geometry) initials[w.id] = { ...w.geometry };
        });
        setInitialGeometries(initials);
      }
    } catch (err) {
      console.error("Failed to scan widgets:", err);
    }
  };

  const toggleWidget = async (widget: Widget): Promise<boolean> => {
    const newStatus = widget.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'open' : 'close';

    if (action === 'open') {
      try {
        await commands.ensureWidgetLinked(widget.name, widget.yuck_path);
      } catch (err) {
        console.error("Failed to link widget:", err);
      }
    }

    const windowToToggle = widget.windows[0] || widget.name.toLowerCase().replace(/\s+/g, '-');
    try {
      await commands.runEwwCommand([action, windowToToggle]);
      const updatedWidgets = (prev: Widget[]) => {
        const next = prev.map(w => w.id === widget.id ? { ...w, status: newStatus } : w);
        // Save session
        const activeIds = next.filter(w => w.status === 'active').map(w => w.id);
        commands.saveActiveWidgets(activeIds);
        return next;
      };
      setWidgets(updatedWidgets as any);
      return true;
    } catch (err) {
      console.error("Failed to toggle widget:", err);
      return false;
    }
  };

  const fetchCommunityWidgets = async () => {
    setIsFetchingCommunity(true);
    try {
      const result = await commands.fetchCommunityWidgets() as unknown as CommunityWidget[];
      setCommunityWidgets(result);
    } catch (err) {
      console.error("Failed to fetch community widgets:", err);
    } finally {
      setIsFetchingCommunity(false);
    }
  };

  return {
    widgets,
    setWidgets,
    initialGeometries,
    communityWidgets,
    isFetchingCommunity,
    fetchLocalWidgets,
    toggleWidget,
    fetchCommunityWidgets
  };
}
