import { ButtonHTMLAttributes } from "react";
const styles = {
  primary: "bg-brand text-white shadow-sm hover:bg-brand-700",
  accent: "bg-highlight text-ink shadow-sm hover:brightness-95",
  outline: "border border-line bg-white text-ink hover:bg-paper",
  danger: "bg-danger text-white hover:brightness-95",
};
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles; loading?: boolean };
export function Button({ variant = "primary", loading, disabled, className = "", children, ...p }: Props) {
  return (
    <button {...p} disabled={disabled || loading} aria-busy={loading}
      className={`min-h-11 rounded-ctl px-4 text-base font-semibold transition active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100 ${styles[variant]} ${className}`}>
      {loading ? "Please wait…" : children}
    </button>
  );
}
