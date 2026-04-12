import * as RadixToast from '@radix-ui/react-toast';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (msg: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setMessages((prev) => [...prev, { ...msg, id }]);
    setTimeout(() => setMessages((prev) => prev.filter((m) => m.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider>
        {children}
        <RadixToast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80" />
        <AnimatePresence>
          {messages.map((msg) => (
            <RadixToast.Root key={msg.id} open asChild>
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className={`fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-lg border p-lg shadow-lg w-80 ${
                  msg.type === 'success'
                    ? 'bg-semantic-success/10 border-semantic-success/30 text-semantic-success'
                    : 'bg-semantic-danger/10 border-semantic-danger/30 text-semantic-danger'
                }`}
              >
                {msg.type === 'success' ? (
                  <CheckCircle size={18} className="text-semantic-success shrink-0 mt-xs" />
                ) : (
                  <AlertCircle size={18} className="text-semantic-danger shrink-0 mt-xs" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{msg.title}</p>
                  {msg.description && <p className="text-xs mt-0.5 opacity-80">{msg.description}</p>}
                </div>
                <button
                  onClick={() => setMessages((prev) => prev.filter((m) => m.id !== msg.id))}
                  className="opacity-60 hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </motion.div>
            </RadixToast.Root>
          ))}
        </AnimatePresence>
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
