import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'slate';
  className?: string;
}

export function Badge({ children, variant = 'blue', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        {
          'bg-blue-500/20 text-blue-300': variant === 'blue',
          'bg-green-500/20 text-green-300': variant === 'green',
          'bg-orange-500/20 text-orange-300': variant === 'orange',
          'bg-red-500/20 text-red-300': variant === 'red',
          'bg-purple-500/20 text-purple-300': variant === 'purple',
          'bg-slate-500/20 text-slate-300': variant === 'slate',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
