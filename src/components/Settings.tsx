import { useState, useEffect, ReactNode } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Power, Play, RefreshCw, LogOut, Terminal, Palette, FolderOpen, Link } from "lucide-react";
import { checkEwwAutostart, enableEwwAutostart, disableEwwAutostart } from "../lib/commands";
import { ask } from "@tauri-apps/plugin-dialog";
import { cn } from "../lib/utils";

interface SettingsProps {
  isEwwRunning: boolean;
  isRestarting: boolean;
  restartEww: () => Promise<boolean>;
  killEww: () => Promise<boolean>;
  liveUpdate: boolean;
  setLiveUpdate: (enabled: boolean) => void;
  setShowOnboarding: (show: boolean) => void;
}

interface OptionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  disabled?: boolean;
}

export function Settings({ isEwwRunning, isRestarting, restartEww, killEww, liveUpdate, setLiveUpdate, setShowOnboarding }: SettingsProps) {
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
  
  const toggleLiveUpdate = async () => {
    if (!liveUpdate) {
      const confirmed = await ask(
        "DANGER: Live Update can PERMANENTLY CORRUPT your widget files if sliders are moved too quickly. This feature is unstable and intended for advanced users only. Proceed?",
        { title: "⚠️ CRITICAL SYSTEM WARNING", kind: "warning" }
      );
      if (confirmed) {
        setLiveUpdate(true);
      }
    } else {
      setLiveUpdate(false);
    }
  };

  const OptionCard = ({ title, description, icon: Icon, children, disabled = false, variant = 'default' }: OptionCardProps & { variant?: 'default' | 'warning' }) => (
    <div className={cn(
      "p-6 rounded-2xl border transition-all flex items-center justify-between",
      disabled ? 'opacity-50' : '',
      variant === 'warning' 
        ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40' 
        : 'bg-[#121212] border-white/5'
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          variant === 'warning' ? 'bg-orange-500/10' : 'bg-white/5'
        )}>
          <Icon className={cn(
            "w-6 h-6",
            variant === 'warning' ? 'text-orange-500' : 'text-white/70'
          )} />
        </div>
        <div>
          <h3 className={cn(
            "font-bold text-lg",
            variant === 'warning' ? 'text-orange-500' : 'text-white'
          )}>{title}</h3>
          <p className="text-white/40 text-sm max-w-md">{description}</p>
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
          description="Automatically start the Veneer manager when your system boots. (Note: Eww has limited GNOME support)"
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

        <h2 className="text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          Experimental Features
        </h2>

        <OptionCard 
          title="Live Geometry Update" 
          description="Update widget geometry in real-time as you slide. Warning: This can cause file corruption if sliders are moved too quickly."
          icon={RefreshCw}
          variant="warning"
        >
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={toggleLiveUpdate}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${liveUpdate ? 'bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.4)]' : 'bg-white/10'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${liveUpdate ? 'translate-x-[26px]' : 'translate-x-1'}`} />
            </button>
            {liveUpdate && (
              <span className="text-[10px] font-black text-orange-500 animate-pulse uppercase tracking-tighter">Active Danger</span>
            )}
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

        <h2 className="text-xl font-bold text-white mt-10 mb-4">Troubleshooting</h2>
        
        <OptionCard 
          title="Setup Wizard" 
          description="Re-run the initial setup wizard to verify dependencies and re-initialize the Eww daemon."
          icon={RefreshCw}
        >
          <button 
            onClick={() => setShowOnboarding(true)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Launch Wizard
          </button>
        </OptionCard>
      </div>
    </motion.div>
  );
}
