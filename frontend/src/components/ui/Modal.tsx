import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  description?: string;
}

export function Modal({ open, onOpenChange, title, description, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 40,
        }} />
        <Dialog.Content
          style={{
            position: 'fixed',
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 50,
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#111e35',
            border: '1px solid #1e3355',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            outline: 'none',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <Dialog.Title style={{ color: '#e2eafc', fontSize: '16px', fontWeight: 700, margin: 0 }}>
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description style={{ color: '#4a6485', fontSize: '13px', margin: '4px 0 0' }}>
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              style={{
                background: 'none',
                border: '1px solid #1e3355',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#4a6485',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ef4444';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1e3355';
                e.currentTarget.style.color = '#4a6485';
              }}
            >
              <X size={16} />
            </Dialog.Close>
          </div>

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
