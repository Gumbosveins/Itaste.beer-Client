import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'

type Variant = 'pink' | 'amber' | 'dark' | 'ghost' | 'green'

const VARIANTS: Record<Variant, string> = {
  pink: 'bg-pink text-white hover:bg-pink-dark',
  amber: 'bg-amber text-white hover:brightness-95',
  dark: 'bg-ink text-white hover:bg-black',
  green: 'bg-[#0f9d58] text-white shadow-[0_6px_16px_rgba(15,157,88,0.3)] hover:brightness-95',
  ghost: 'bg-white text-ink ring-1 ring-black/10 hover:bg-foam',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  busy?: boolean
}

export function Button({ variant = 'pink', busy = false, className = '', children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-[14px] px-5 py-3 text-sm font-semibold shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    >
      {busy && <Spinner />}
      {children}
    </button>
  )
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} aria-hidden />
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export function Field({ label, hint, className = '', ...rest }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink/80">{label}</span>
      <input
        {...rest}
        className={`w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base outline-none transition focus:border-pink focus:ring-4 focus:ring-pink/15 ${className}`}
      />
      {hint && <span className="mt-1 block text-xs text-ink/50">{hint}</span>}
    </label>
  )
}

interface TopBarProps {
  title?: ReactNode
  right?: ReactNode
}

export function TopBar({ title, right }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 bg-pink px-4 text-white sm:h-[72px] sm:px-7">
      <Link to="/" className="font-display text-2xl tracking-wide sm:text-[28px]" aria-label="iTaste.beer home">
        iTaste.beer
      </Link>
      {title && (
        <>
          <span className="hidden h-7 w-px bg-white/40 sm:block" aria-hidden />
          <div className="min-w-0 flex-1 truncate font-semibold sm:text-lg">{title}</div>
        </>
      )}
      {!title && <div className="flex-1" />}
      <div className="flex items-center gap-2">{right}</div>
    </header>
  )
}

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25">
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`panel p-5 ${className}`}>{children}</div>
}

export function Logo({ className = 'w-64' }: { className?: string }) {
  return <img src="/images/logo.png" alt="iTaste Beer Tasting" className={`mx-auto drop-shadow-xl ${className}`} />
}

export function BeerImage({ src, hidden, className = 'h-14 w-14' }: { src: string | null | undefined; hidden?: boolean; className?: string }) {
  const url = hidden || !src ? '/images/unknown.png' : src
  return <img src={url} alt="" className={`rounded-full bg-white object-contain ring-2 ring-white ${className}`} loading="lazy" />
}

export const HIDDEN = '???????'

export function FormPage({ title, color = 'bg-pink', children }: { title: string; color?: string; children: ReactNode }) {
  return (
    <div className={`min-h-screen ${color}`}>
      <TopBar title={title} />
      <main className="mx-auto max-w-md px-4 pb-16 pt-6">
        <Logo className="mb-6 w-40" />
        {children}
      </main>
    </div>
  )
}
