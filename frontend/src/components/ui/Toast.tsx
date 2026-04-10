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
                className={`fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-xl border p-4 shadow-xl w-80 ${
                  msg.type === 'success'
                    ? 'bg-green-950 border-green-800 text-green-100'
                    : 'bg-red-950 border-red-800 text-red-100'
                }`}
              >
                {msg.type === 'success' ? (
                  <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
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
