import { ButtonHTMLAttributes } from "react";
const styles = {
  primary: "bg-indigo text-white hover:bg-indigo-700",
  accent: "bg-marigold text-ink hover:brightness-95",
  outline: "border border-line bg-white text-ink hover:bg-paper",
  danger: "bg-danger text-white hover:brightness-95",
};
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles; loading?: boolean };
export function Button({ variant = "primary", loading, disabled, className = "", children, ...p }: Props) {
  return (
    <button {...p} disabled={disabled || loading} aria-busy={loading}
      className={`min-h-11 rounded-ctl px-4 font-semibold transition-colors disabled:opacity-60 ${styles[variant]} ${className}`}>
      {loading ? "Please wait…" : children}
    </button>
  );
}
