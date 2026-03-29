import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Power, Play, RefreshCw, LogOut, Terminal, Palette, FolderOpen, Link } from "lucide-react";
import { checkEwwAutostart, enableEwwAutostart, disableEwwAutostart } from "../lib/commands";

interface SettingsProps {
  isEwwRunning: boolean;
  isRestarting: boolean;
  restartEww: () => Promise<boolean>;
  killEww: () => Promise<boolean>;
}

export function Settings({ isEwwRunning, isRestarting, restartEww, killEww }: SettingsProps) {
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [isLoadingAuto, setIsLoadingAuto] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const enabled = await checkEwwAutostart();
        if (isMounted) {
          setAutostartEnabled(enabled);
        }
      } catch (error) {
        console.error("Failed to check Eww autostart:", error);
      } finally {
        if (isMounted) {
          setIsLoadingAuto(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleAutostart = async () => {
    setIsLoadingAuto(true);
    try {
      if (autostartEnabled) {
        await disableEwwAutostart();
        setAutostartEnabled(false);
      } else {
        await enableEwwAutostart();
        setAutostartEnabled(true);
      }
    } catch (error) {
      console.error("Failed to toggle Eww autostart:", error);
    } finally {
      setIsLoadingAuto(false);
    }
  };

  const OptionCard = ({ title, description, icon: Icon, children, disabled = false }: any) => (
    <div className={`p-6 rounded-2xl border border-white/5 bg-[#121212] flex items-center justify-between ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
          <Icon className="w-6 h-6 text-white/70" />
        </div>
        <div>
          <h3 className="text-white font-medium text-lg">{title}</h3>
          <p className="text-white/40 text-sm">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );

  return (
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
        <SettingsIcon className="w-10 h-10 text-white/10 animate-[spin_10s_linear_infinite]" />
      </header>

      <div className="space-y-6 max-w-4xl">
        <h2 className="text-xl font-bold text-white mb-4">Daemon Controls</h2>
        
        <OptionCard 
          title="Start on Boot" 
          description="Automatically start the Eww daemon when your system boots."
          icon={Power}
        >
          <button
            onClick={toggleAutostart}
            disabled={isLoadingAuto}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${autostartEnabled ? 'bg-blue-600' : 'bg-white/10'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${autostartEnabled ? 'translate-x-[26px]' : 'translate-x-1'}`} />
          </button>
        </OptionCard>

        <OptionCard 
          title="Eww Daemon Status" 
          description={isEwwRunning ? "Daemon is currently active and running." : "Daemon is currently stopped."}
          icon={Terminal}
        >
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-white/5 mr-4">
              <span className={`w-2.5 h-2.5 rounded-full ${isEwwRunning ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-white/70">{isEwwRunning ? 'Running' : 'Stopped'}</span>
            </div>
            {isEwwRunning ? (
              <button
                onClick={killEww}
                disabled={isRestarting}
                className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                Kill Switch
              </button>
            ) : (
              <button
                onClick={restartEww}
                disabled={isRestarting}
                className="px-4 py-2 bg-green-600/10 hover:bg-green-600/20 text-green-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-green-500/20"
              >
                <Play className="w-4 h-4" />
                Start Daemon
              </button>
            )}
            <button
              onClick={restartEww}
              disabled={isRestarting}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRestarting ? 'animate-spin' : ''}`} />
              Restart
            </button>
          </div>
        </OptionCard>

        <h2 className="text-xl font-bold text-white mt-10 mb-4">Additional Settings (Coming Soon)</h2>
        
        <OptionCard 
          title="Veneer GUI Autostart" 
          description="Start this configuration window automatically on system boot."
          icon={FolderOpen}
          disabled={true}
        >
           <button disabled className="px-4 py-2 bg-white/5 text-white/30 rounded-lg text-sm font-medium">Coming Soon</button>
        </OptionCard>
        
        <OptionCard 
          title="Theme Toggle" 
          description="Switch between Light and Dark themes for the Widget Manager."
          icon={Palette}
          disabled={true}
        >
           <button disabled className="px-4 py-2 bg-white/5 text-white/30 rounded-lg text-sm font-medium">Coming Soon</button>
        </OptionCard>

        <OptionCard 
          title="Community Registry URL" 
          description="Change the default URL to fetch community widgets from a custom repository."
          icon={Link}
          disabled={true}
        >
           <button disabled className="px-4 py-2 bg-white/5 text-white/30 rounded-lg text-sm font-medium">Coming Soon</button>
        </OptionCard>
      </div>
    </motion.div>
  );
}
