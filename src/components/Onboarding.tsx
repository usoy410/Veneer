import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Terminal as TerminalIcon,
  CheckCircle,
  Copy,
  RefreshCw,
  ShieldCheck,
  Layout,
  Tractor,
  ExternalLink
} from "lucide-react";
import * as commands from "../lib/commands";
import { cn } from "../lib/utils";

interface OnboardingProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'dependencies' | 'install' | 'daemon' | 'autostart' | 'finish';

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [distro, setDistro] = useState<string>("generic");
  const [isEwwInstalled, setIsEwwInstalled] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isStartingDaemon, setIsStartingDaemon] = useState(false);
  const [isAutostartEnabled, setIsAutostartEnabled] = useState(false);

  useEffect(() => {
    const init = async () => {
      const d = await commands.getDistroInfo();
      setDistro(d);
      const installed = await commands.checkEww();
      setIsEwwInstalled(installed);
    };
    init();
  }, []);

  const verifyInstallation = async () => {
    setIsVerifying(true);
    setVerificationFailed(false);
    const installed = await commands.checkEww();
    setIsEwwInstalled(installed);

    setTimeout(() => {
      setIsVerifying(false);
      if (installed) {
        setCurrentStep('daemon');
      } else {
        setVerificationFailed(true);
        setTimeout(() => setVerificationFailed(false), 3000);
      }
    }, 1500);
  };

  const handleStartDaemon = async () => {
    setIsStartingDaemon(true);
    try {
      await commands.restartEww();
      setTimeout(() => {
        setIsStartingDaemon(false);
        setCurrentStep('autostart');
      }, 2000);
    } catch (err) {
      console.error("Failed to start daemon:", err);
      setIsStartingDaemon(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const getInstallCommand = () => {
    switch (distro) {
      case 'arch': return "yay -S eww";
      case 'ubuntu':
      case 'debian': return "sudo apt update && sudo apt install -y eww";
      case 'fedora': return "sudo dnf install eww";
      default: return "cargo install eww --locked";
    }
  };

  const stepVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0a0b] flex items-center justify-center p-6 font-sans text-white">
      <div className="max-w-2xl w-full bg-[#121214] rounded-[2rem] border border-white/5 shadow-[0_0_100px_rgba(37,99,235,0.1)] overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          <motion.div
            className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
            initial={{ width: "0%" }}
            animate={{
              width:
                currentStep === 'welcome' ? '20%' :
                  currentStep === 'dependencies' ? '40%' :
                    currentStep === 'install' ? '60%' :
                      currentStep === 'daemon' ? '75%' :
                        currentStep === 'autostart' ? '90%' : '100%'
            }}
          />
        </div>

        <div className="p-12">
          <AnimatePresence mode="wait">
            {currentStep === 'welcome' && (
              <motion.div
                key="welcome"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6 text-center"
              >
                <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20">
                  <Layout className="w-10 h-10 text-blue-500" />
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tight">Welcome to Veneer</h1>
                <p className="text-white/50 text-lg leading-relaxed max-w-md mx-auto">
                  Let’s get your desktop environment ready. We’ll help you set up the essential components to start managing your widgets.
                </p>
                <button
                  onClick={() => setCurrentStep('dependencies')}
                  className="mt-8 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold flex items-center gap-2 mx-auto transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                  Get Started <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {currentStep === 'dependencies' && (
              <motion.div
                key="dependencies"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-8"
              >
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                    <ShieldCheck className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">System Check</h2>
                    <p className="text-white/40 text-sm">Verifying core requirements for Veneer to function.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-[#18181b] border border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/10 transition-colors group-hover:border-blue-500/30">
                        <Tractor className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-bold">Eww Widget Engine</p>
                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Core Dependency</p>
                      </div>
                    </div>
                    {isEwwInstalled ? (
                      <div className="flex items-center gap-2 text-green-500 font-bold bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                        <CheckCircle className="w-4 h-4" />
                        Found
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-500 font-bold bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
                        <TerminalIcon className="w-4 h-4" />
                        Missing
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  {isEwwInstalled ? (
                    <button
                      onClick={() => setCurrentStep('daemon')}
                      className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentStep('install')}
                      className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)] text-center"
                    >
                      Install Eww
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 'install' && (
              <motion.div
                key="install"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-8"
              >
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                    <TerminalIcon className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Installation</h2>
                    <p className="text-white/40 text-sm">Run this command to install the required engine.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium text-white/60">We’ve detected your system as <span className="text-blue-400 font-black uppercase font-mono">{distro}</span>. Please copy and run this in your terminal:</p>

                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <div className="relative bg-[#0a0a0b] p-6 rounded-2xl border border-white/5 font-mono text-sm leading-relaxed flex justify-between items-center overflow-x-auto">
                      <span className="text-blue-400">$</span>
                      <span className="ml-4 truncate select-all">{getInstallCommand()}</span>
                      <button
                        onClick={() => copyToClipboard(getInstallCommand())}
                        className="ml-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                        title="Copy to clipboard"
                      >
                        {copyFeedback ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-white/20 italic">Note: You might need to refresh your shell or system PATH after installation.</p>
                </div>

                <div className="flex flex-col gap-3 pt-4 relative">
                  <AnimatePresence>
                    {verificationFailed && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-6 left-0 right-0 text-center text-red-500 text-xs font-bold uppercase tracking-widest"
                      >
                        Still not found! Try again.
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button
                    onClick={verifyInstallation}
                    disabled={isVerifying}
                    animate={verificationFailed ? { x: [-4, 4, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className={cn(
                      "w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2",
                      verificationFailed ? "bg-red-600 text-white" : "bg-white text-black hover:bg-white/90"
                    )}
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : "I've Installed It"}
                  </motion.button>
                  <button
                    onClick={() => setCurrentStep('dependencies')}
                    className="w-full py-3 bg-transparent text-white/40 hover:text-white text-sm font-bold transition-colors"
                  >
                    Back to Check
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 'daemon' && (
              <motion.div
                key="daemon"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-8"
              >
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/10">
                    <RefreshCw className={cn("w-8 h-8 text-blue-500", isStartingDaemon ? "animate-spin" : "")} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Final Step</h2>
                    <p className="text-white/40 text-sm">Let’s initialize the background service.</p>
                  </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-2xl leading-relaxed text-white/70">
                  <p>Veneer needs the <span className="text-blue-400 font-bold">Eww Daemon</span> to keep your widgets alive. We’re ready to start it up and finalize your configuration.</p>
                </div>

                <button
                  onClick={handleStartDaemon}
                  disabled={isStartingDaemon}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
                >
                  {isStartingDaemon ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Starting Service...
                    </>
                  ) : "Initialize Now"}
                </button>
              </motion.div>
            )}

            {currentStep === 'autostart' && (
              <motion.div
                key="autostart"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-8"
              >
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/10">
                    <Tractor className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Stay Active</h2>
                    <p className="text-white/40 text-sm">Should Veneer start automatically when you boot?</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-[#18181b] border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="font-bold">Standard Autostart</p>
                      <p className="text-xs text-white/30">Works for KDE, XFCE, and most XDG desktops. (Eww has limited GNOME support)</p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          if (isAutostartEnabled) {
                            await commands.disableEwwAutostart();
                            setIsAutostartEnabled(false);
                          } else {
                            await (commands.enableEwwAutostart as any)();
                            setIsAutostartEnabled(true);
                          }
                        } catch (e) {
                          console.error("Autostart toggle failed:", e);
                        }
                      }}
                      className={cn(
                        "w-14 h-7 rounded-full transition-colors relative p-1",
                        isAutostartEnabled ? "bg-blue-600" : "bg-white/10"
                      )}
                    >
                      <motion.div
                        className="w-5 h-5 bg-white rounded-full shadow-lg"
                        animate={{ x: isAutostartEnabled ? 28 : 0 }}
                      />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 italic flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3" />
                      Wayland / Tiling WM Users (Niri, Hyprland, etc.)
                    </p>
                    <div className="bg-[#0a0a0b] p-4 rounded-xl border border-white/5 font-mono text-[10px] space-y-2 text-white/60">
                      <p className="text-blue-400/80"># Add this to your config file (e.g niri):</p>
                      <div className="flex justify-between group">
                        <span>spawn-at-startup "veneer" "--hidden"</span>
                        <button onClick={() => copyToClipboard('spawn-at-startup "veneer" "--hidden"')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {copyFeedback ? <CheckCircle className="w-2 h-2 text-green-500" /> : <Copy className="w-2 h-2" />}
                        </button>
                      </div>
                      <p className="pt-2 text-[9px] italic opacity-40">Note: Use 'exec-once = veneer --hidden' for Hyprland.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep('finish')}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)] text-center"
                >
                  Continue to Finish
                </button>
              </motion.div>
            )}

            {currentStep === 'finish' && (
              <motion.div
                key="finish"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-8 text-center"
              >
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20 relative">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-green-500/20"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tight">You’re All Set!</h1>
                <p className="text-white/50 text-lg leading-relaxed max-w-md mx-auto">
                  Veneer is fully configured. You can now start building, customizing, and managing your Linux desktop widgets.
                </p>
                <button
                  onClick={onComplete}
                  className="mt-8 px-12 py-4 bg-green-600 hover:bg-green-500 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  Enter Dashboard
                </button>

                <div className="pt-8 border-t border-white/5 flex justify-center gap-6">
                  <a href="https://github.com/usoy410/Veneer" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-white/20 hover:text-white/40 flex items-center gap-1 transition-colors">
                    DOCUMENTATION <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
