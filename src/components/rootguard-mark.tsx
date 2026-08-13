export function RootGuardMark({ size = 24 }: { size?: number }) {
  return <svg aria-hidden="true" className="rootguard-mark" width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L16 3L26 8V18L16 29L6 18V8Z" stroke="currentColor" strokeWidth="2"/><path d="M6 8L16 14L26 8M16 14V29" stroke="currentColor" strokeWidth="2"/><circle cx="16" cy="14" r="3.25" fill="currentColor"/></svg>;
}
