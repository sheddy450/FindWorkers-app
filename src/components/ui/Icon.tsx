const P: Record<string, string> = {
  home: "M3 11 12 3l9 8v10h-6v-6H9v6H3z",
  back: "M15 18l-6-6 6-6",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5",
  requests: "M7 4h10a1 1 0 0 1 1 1v15H6V5a1 1 0 0 1 1-1zM9 9h6M9 13h6M9 17h3",
  chat: "M4 5h16v11H9l-5 4z",
  user: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c0-4 4-6 8-6s8 2 8 6",
  check: "M5 12l5 5 9-10",
  alert: "M12 3 2 20h20zM12 10v5M12 17.5v.5",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5",
  x: "M6 6l12 12M18 6 6 18",
  star: "M12 3l2.6 6 6.4.6-4.8 4.3 1.5 6.6L12 17l-5.7 3.5 1.5-6.6L3 9.6 9.4 9z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eyeOff: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 4l16 16",
  pin: "M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12zM12 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  wrench: "M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 0-2-2z",
};
export type IconName = keyof typeof P;
export function Icon({ name, size = 20, filled = false, label }: { name: IconName; size?: number; filled?: boolean; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role={label ? "img" : undefined}
      aria-label={label} aria-hidden={label ? undefined : true}><path d={P[name]} /></svg>
  );
}
