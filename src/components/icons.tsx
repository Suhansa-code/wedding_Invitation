export function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={diagonal ? { transform: "rotate(-45deg)" } : undefined}><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}

export function Ornament({ className = "" }: { className?: string }) {
  return <svg className={className} width="100" height="28" viewBox="0 0 100 28" fill="none" aria-hidden="true"><path d="M0 14h34m32 0h34M38 14l12-9 12 9-12 9-12-9Z" stroke="currentColor" strokeWidth=".7" /><path d="m45 14 5-4 5 4-5 4-5-4Z" fill="currentColor" /></svg>;
}
