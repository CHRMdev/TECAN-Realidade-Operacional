import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface KpiCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accentColor?: string;
  delay?: number;
  suffix?: string;
}

function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    setCount(0);
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(ease * target));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return count;
}

export function KpiCard({ label, value, icon: Icon, accentColor = '#1a78d4', delay = 0, suffix }: KpiCardProps) {
  const count = useCountUp(value);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        backgroundColor: hovered ? '#142236' : '#111e35',
        border: `1px solid ${hovered ? accentColor + '50' : '#1e3355'}`,
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        cursor: 'default',
        overflow: 'hidden',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? `0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px ${accentColor}20` : 'none',
      }}
    >
      {/* Icon top-right */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
        <p style={{
          color: '#4a6485',
          fontSize: '10px',
          fontWeight: 700,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          lineHeight: 1.3,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {label}
        </p>
        <div style={{
          padding: '5px',
          borderRadius: '7px',
          backgroundColor: `${accentColor}18`,
          color: accentColor,
          flexShrink: 0,
          display: 'flex',
          transition: 'background 0.2s',
        }}>
          <Icon size={14} />
        </div>
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
        <span style={{
          color: '#e2eafc',
          fontSize: '24px',
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {count.toLocaleString('pt-BR')}
        </span>
        {suffix && (
          <span style={{ color: '#4a6485', fontSize: '11px', fontWeight: 600 }}>{suffix}</span>
        )}
      </div>

      {/* Accent bar bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: hovered ? '100%' : '40%',
        height: '2px',
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}00)`,
        transition: 'width 0.3s ease',
        borderRadius: '0 0 12px 0',
      }} />
    </motion.div>
  );
}
