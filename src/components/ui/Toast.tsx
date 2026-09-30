"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { Alert } from "./Alert";
type T = { id: number; variant: "success" | "error" | "info"; message: string };
const Ctx = createContext<(variant: T["variant"], message: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((variant: T["variant"], message: string) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, variant, message }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 6000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 mx-auto flex max-w-sm flex-col gap-2 px-4 md:bottom-6">
        {items.map((t) => <div key={t.id} className="pointer-events-auto shadow-lg"><Alert variant={t.variant} title={t.message} /></div>)}
      </div>
    </Ctx.Provider>
  );
}
