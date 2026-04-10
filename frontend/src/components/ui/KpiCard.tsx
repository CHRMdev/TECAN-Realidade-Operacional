import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface KpiCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: string;
  delay?: number;
}

function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

export function KpiCard({ label, value, icon: Icon, color = 'text-blue-400', delay = 0 }: KpiCardProps) {
  const count = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-slate-800 rounded-xl p-5 border border-slate-700 flex items-start gap-4 hover:border-slate-600 transition-colors"
    >
      <div className={`p-2.5 rounded-lg bg-slate-700/60 ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-100">{count}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}
