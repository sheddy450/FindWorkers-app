"use client";
import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useId, useState } from "react";
import { Icon } from "./Icon";

type Base = { label: string; hint?: string; error?: string };
const field = "w-full rounded-ctl border bg-white p-3 text-base transition-colors placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";
const border = (e?: string) => (e ? "border-danger" : "border-line");

function Wrap({ id, label, hint, error, children }: Base & { id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <div className="mt-1">{children}</div>
      {error ? <p id={`${id}-msg`} role="alert" className="mt-1 text-sm text-danger">{error}</p>
        : hint ? <p id={`${id}-msg`} className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
const aria = (id: string, b: Base) => ({ id, "aria-invalid": !!b.error, "aria-describedby": b.error || b.hint ? `${id}-msg` : undefined });

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & Base>(
  function Input({ label, hint, error, className = "", ...p }, ref) {
    const id = useId();
    return <Wrap id={id} label={label} hint={hint} error={error}>
      <input ref={ref} {...p} {...aria(id, { label, hint, error })} className={`${field} ${border(error)} ${className}`} /></Wrap>;
  });

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & Base>(
  function PasswordInput({ label, hint, error, ...p }, ref) {
    const id = useId(); const [show, setShow] = useState(false);
    return <Wrap id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <input ref={ref} {...p} {...aria(id, { label, hint, error })} type={show ? "text" : "password"} className={`${field} ${border(error)} pr-12`} />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}
          className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-ctl text-muted">
          <Icon name={show ? "eyeOff" : "eye"} /></button>
      </div></Wrap>;
  });

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & Base>(
  function Textarea({ label, hint, error, className = "", ...p }, ref) {
    const id = useId();
    return <Wrap id={id} label={label} hint={hint} error={error}>
      <textarea ref={ref} rows={4} {...p} {...aria(id, { label, hint, error })} className={`${field} ${border(error)} ${className}`} /></Wrap>;
  });
