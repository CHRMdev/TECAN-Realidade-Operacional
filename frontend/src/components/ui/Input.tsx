import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, style, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {label && (
          <label htmlFor={inputId} style={{ fontSize: '13px', fontWeight: 600, color: '#7a9bc4' }}>
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: '14px',
            backgroundColor: '#0d1a30',
            border: `1.5px solid ${error ? '#ef4444' : '#1e3355'}`,
            borderRadius: '8px',
            outline: 'none',
            color: '#e2eafc',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
            ...style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = error ? '#ef4444' : '#1a78d4';
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? '#ef4444' : '#1e3355';
            props.onBlur?.(e);
          }}
          className={className}
          {...props}
        />
        {error && <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>{error}</p>}
        {helperText && !error && <p style={{ fontSize: '12px', color: '#4a6485', margin: 0 }}>{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
