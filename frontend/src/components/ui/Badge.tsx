interface BadgeProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'sage' | 'default';
  className?: string;
}

const variantStyles: Record<string, { bg: string; color: string }> = {
  info:    { bg: '#1a78d420', color: '#60a5fa' },
  success: { bg: '#10b98120', color: '#34d399' },
  warning: { bg: '#f59e0b20', color: '#fbbf24' },
  danger:  { bg: '#ef444420', color: '#f87171' },
  sage:    { bg: '#6b9e8f20', color: '#6b9e8f' },
  default: { bg: '#1e335580', color: '#7a9bc4' },
};

export function Badge({ children, variant = 'info', className }: BadgeProps) {
  const s = variantStyles[variant] ?? variantStyles.default;
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '9999px',
        padding: '2px 10px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: s.bg,
        color: s.color,
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </span>
  );
}
