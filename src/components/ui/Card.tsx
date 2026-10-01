import { HTMLAttributes } from "react";
export function Card({ className = "", ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={`rounded-card border border-line bg-white p-4 shadow-[0_1px_2px_rgba(23,26,33,0.05)] ${className}`} />;
}
