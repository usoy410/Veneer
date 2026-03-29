import { useState, useEffect } from "react";
import type { Widget, CommunityWidget } from "../types/widget";
import * as commands from "../lib/commands";

export function useWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [initialGeometries, setInitialGeometries] = useState<Record<string, Widget['geometry']>>({});
  const [communityWidgets, setCommunityWidgets] = useState<CommunityWidget[]>([]);
  const [isFetchingCommunity, setIsFetchingCommunity] = useState(false);

  const fetchLocalWidgets = async () => {
    try {
      const scannedWidgets = await commands.scanWidgets() as unknown as Widget[];
      if (scannedWidgets && Array.isArray(scannedWidgets)) {
        setWidgets(scannedWidgets);
        const initials: Record<string, Widget['geometry']> = {};
        scannedWidgets.forEach(w => {
          if (w.id && w.geometry) initials[w.id] = { ...w.geometry };
        });
        setInitialGeometries(initials);
      }
    } catch (err) {
      console.error("Failed to scan widgets:", err);
    }
  };

  useEffect(() => {
    fetchLocalWidgets();
  }, []);

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
      setWidgets(prev => prev.map(w => w.id === widget.id ? { ...w, status: newStatus } : w));
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
