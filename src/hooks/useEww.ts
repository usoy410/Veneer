import { useState, useEffect } from "react";
import { currentMonitor } from "@tauri-apps/api/window";
import { checkEww, restartEww as restartEwwCommand, checkEwwRunning, killEwwDaemon } from "../lib/commands";

export function useEww() {
  const [isEwwReady, setIsEwwReady] = useState(false);
  const [isEwwRunning, setIsEwwRunning] = useState(false);
  const [monitorSize, setMonitorSize] = useState({ width: 1920, height: 1080 });
  const [isRestarting, setIsRestarting] = useState(false);

  const checkStatus = async () => {
    try {
      const ready = await checkEww();
      setIsEwwReady(ready);
      const running = await checkEwwRunning();
      setIsEwwRunning(running);
    } catch (err) {
      console.error("Failed to check eww status:", err);
    }
  };

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
      await checkStatus();
    };
    init();

    // Poll status occasionally
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const restartEww = async (): Promise<boolean> => {
    setIsRestarting(true);
    try {
      await restartEwwCommand();
      await checkStatus();
      setIsRestarting(false);
      return true;
    } catch (err) {
      console.error("Failed to restart Eww:", err);
      setIsRestarting(false);
      return false;
    }
  };

  const killEww = async (): Promise<boolean> => {
    setIsRestarting(true);
    try {
      await killEwwDaemon();
      await checkStatus();
      setIsRestarting(false);
      return true;
    } catch (err) {
      console.error("Failed to kill Eww:", err);
      setIsRestarting(false);
      return false;
    }
  };

  return { isEwwReady, isEwwRunning, monitorSize, isRestarting, restartEww, killEww, checkStatus };
}
