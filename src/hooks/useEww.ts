import { useState, useEffect } from "react";
import { currentMonitor } from "@tauri-apps/api/window";
import { checkEww, restartEww as restartEwwCommand } from "../lib/commands";

export function useEww() {
  const [isEwwReady, setIsEwwReady] = useState(false);
  const [monitorSize, setMonitorSize] = useState({ width: 1920, height: 1080 });
  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    const init = async () => {
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

      try {
        const ready = await checkEww();
        setIsEwwReady(ready);
      } catch (err) {
        console.error("Failed to check eww status:", err);
      }
    };
    init();
  }, []);

  const restartEww = async (): Promise<boolean> => {
    setIsRestarting(true);
    try {
      await restartEwwCommand();
      const ready = await checkEww();
      setIsEwwReady(ready);
      setIsRestarting(false);
      return true;
    } catch (err) {
      console.error("Failed to restart Eww:", err);
      setIsRestarting(false);
      return false;
    }
  };

  return { isEwwReady, monitorSize, isRestarting, restartEww };
}
