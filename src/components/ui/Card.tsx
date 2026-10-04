import { HTMLAttributes } from "react";
export function Card({ className = "", ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={`rounded-card border border-line/70 bg-white p-4 shadow-soft ${className}`} />;
}
