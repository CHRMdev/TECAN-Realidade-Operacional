import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants: Record<string, { bg: string; color: string; border: string; hover: string }> = {
  primary:   { bg: '#1a78d4', color: '#fff', border: '#1a78d4', hover: '#1566b8' },
  secondary: { bg: '#162543', color: '#60a5fa', border: '#1e3355', hover: '#1a2e4a' },
  ghost:     { bg: 'transparent', color: '#60a5fa', border: 'transparent', hover: '#162543' },
  danger:    { bg: '#ef4444', color: '#fff', border: '#ef4444', hover: '#dc2626' },
  success:   { bg: '#10b981', color: '#fff', border: '#10b981', hover: '#059669' },
  warning:   { bg: '#f59e0b', color: '#0b1628', border: '#f59e0b', hover: '#d97706' },
};

const sizes: Record<string, { padding: string; fontSize: string }> = {
  sm: { padding: '6px 12px', fontSize: '12px' },
  md: { padding: '8px 16px', fontSize: '13px' },
  lg: { padding: '11px 20px', fontSize: '15px' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        backgroundColor: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        padding: s.padding,
        fontSize: s.fontSize,
        transition: 'all 0.15s ease',
        userSelect: 'none',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) e.currentTarget.style.backgroundColor = v.hover;
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) e.currentTarget.style.backgroundColor = v.bg;
        onMouseLeave?.(e);
      }}
      className={className}
      {...props}
    >
      {loading && (
        <svg className="animate-spin" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
