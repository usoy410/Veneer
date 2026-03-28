import { LayoutDashboard, Library, Settings, Settings2 } from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "library", icon: Library, label: "Library" },
    { id: "customizer", icon: Settings2, label: "Customizer" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="w-64 h-screen bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col p-4">
      <div className="flex items-center gap-3 px-2 mb-8 mt-4">
        <img src="/logo.png" alt="Veneer" className="w-8 h-8 rounded-lg shadow-lg shadow-blue-500/20 object-cover" />
        <span className="font-bold text-lg tracking-tight">Veneer</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
              activeTab === item.id
                ? "bg-white/10 text-white shadow-sm"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              activeTab === item.id ? "text-blue-400" : "group-hover:text-white"
            )} />
            <span className="font-medium">{item.label}</span>
            {activeTab === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto p-2 bg-white/5 rounded-2xl border border-white/5">
        <div className="text-xs text-white/40 mb-2 px-1 uppercase tracking-widest font-bold">System Status</div>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-white/80">Eww Ready</span>
        </div>
      </div>
    </div>
  );
}
