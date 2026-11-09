import { Link } from 'react-router'
import { DonateButton } from '../components/DonateButton'
import { hasTasterSession, readSession } from '../lib/session'

export default function Home() {
  const session = readSession()
  const canContinue = hasTasterSession(session)

  return (
    <div className="min-h-screen bg-pink text-white">
      <header className="flex h-16 items-center px-4 sm:h-[72px] sm:px-10">
        <span className="font-display text-[28px] tracking-wide">iTaste.beer</span>
        <div className="flex-1" />
        <DonateButton />
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-16">
        <img src="/images/logo.png" alt="iTaste Beer Tasting" className="mt-2 w-64 drop-shadow-xl sm:w-[360px]" />
        <h1 className="mt-5 text-center font-display text-5xl leading-none sm:text-[64px]">Beer tasting, scored live</h1>
        <p className="mt-3 max-w-[520px] text-center text-lg leading-relaxed text-white/90">
          Everyone rates on their phone. The results land on the big screen the moment the last vote is in.
        </p>

        <div className="mt-9 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
          <Link
            to="/create"
            className="flex h-16 items-center justify-center gap-2.5 rounded-[18px] bg-white px-7 text-lg font-bold text-pink shadow-[0_10px_30px_rgba(120,0,40,0.25)] transition hover:-translate-y-0.5 sm:min-w-60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create a room
          </Link>
          <Link
            to="/join"
            className="flex h-16 items-center justify-center gap-2.5 rounded-[18px] bg-ink px-7 text-lg font-bold text-white shadow-[0_10px_30px_rgba(60,0,20,0.25)] transition hover:-translate-y-0.5 sm:min-w-60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="6" y="2" width="12" height="20" rx="3" />
              <path d="M11 18h2" />
            </svg>
            Join with a code
          </Link>
        </div>

        <nav className="mt-5 flex flex-wrap justify-center gap-x-7 gap-y-2 text-[15px] font-semibold">
          <Link to="/opendashboard" className="flex items-center gap-2 hover:underline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="2" y="4" width="20" height="13" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            Open the TV dashboard
          </Link>
          <Link to="/howitworks" className="flex items-center gap-2 hover:underline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 16v.5M12 8a2.5 2.5 0 0 1 1.5 4.5c-.9.6-1.5 1.1-1.5 2" />
            </svg>
            How it works
          </Link>
        </nav>

        {canContinue && (
          <Link
            to={`/userRoom/${session.roomCode}`}
            className="mt-9 flex w-full max-w-[460px] items-center gap-3.5 rounded-[18px] border border-white/30 bg-white/15 px-5 py-4 transition hover:bg-white/20"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-pink">
              {session.username?.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] text-white/80">Pick up where you left off</span>
              <span className="block truncate text-[17px] font-bold">{session.username}</span>
            </span>
            <span className="rounded-[10px] bg-white px-3 pt-1 font-display text-[26px] tracking-[0.2em] text-pink">{session.roomCode}</span>
          </Link>
        )}

        <p className="mt-12 text-center text-sm text-white/75">
          Bugs or ideas? <a className="font-semibold text-white underline" href="mailto:gumbosveins@gmail.com">gumbosveins@gmail.com</a>
        </p>
      </main>
    </div>
  )
}
