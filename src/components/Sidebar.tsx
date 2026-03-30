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
    <div className="w-64 h-screen bg-[#121212] border-r border-[#2c2c2c] flex flex-col p-4 shadow-sm z-10">
      <div className="flex items-center gap-1 mb-8 mt-4">
        <img src="/logo.png" alt="Veneer" className="w-20 h-20 rounded-lg shadow-sm object-cover" />
        <span className="font-bold text-3xl tracking-tight text-white">Veneer</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group",
              activeTab === item.id
                ? "bg-blue-600/10 text-blue-500"
                : "text-gray-400 hover:text-white hover:bg-[#1e1e1e]"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              activeTab === item.id ? "text-blue-500" : "group-hover:text-white"
            )} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto p-3 bg-[#1e1e1e] rounded-xl border border-[#2c2c2c] shadow-sm">
        <div className="text-[10px] text-gray-500 mb-2 px-1 uppercase tracking-widest font-bold">System Status</div>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-gray-300">Eww Ready</span>
        </div>
      </div>
    </div>
  );
}
