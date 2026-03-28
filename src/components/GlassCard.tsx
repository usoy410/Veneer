import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function GlassCard({ children, className, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "bg-[#1e1e1e] rounded-xl p-6 shadow-md transition-shadow hover:shadow-lg border border-white/5",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
