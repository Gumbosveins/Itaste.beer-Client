import { Link, useNavigate } from 'react-router'
import { Card, Logo } from '../components/ui'
import { DonateForm } from '../components/DonateForm'
import { hasTasterSession, readSession } from '../lib/session'

const tiles = [
  { to: '/create', label: 'Create Room', sub: 'Pick beers and categories', className: 'bg-amber' },
  { to: '/join', label: 'Join Room', sub: 'Rate on your phone', className: 'bg-ink' },
  { to: '/opendashboard', label: 'Open Dashboard', sub: 'Put the results on the TV', className: 'bg-violet-600' },
  { to: '/howitworks', label: 'How it works', sub: 'A two minute tour', className: 'bg-emerald-600' },
]

export default function Home() {
  const navigate = useNavigate()
  const session = readSession()
  const canContinue = hasTasterSession(session)

  return (
    <div className="min-h-screen bg-pink">
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-10">
        <Logo className="w-72 sm:w-96" />
        <h1 className="sr-only">iTaste.beer</h1>
        <p className="mx-auto mt-4 max-w-md text-center text-lg font-medium text-white/90">
          Live beer tasting with friends. Everyone rates on their phone, the results appear on the big screen.
        </p>

        {canContinue && (
          <button
            type="button"
            onClick={() => navigate(`/userRoom/${session.roomCode}`)}
            className="mx-auto mt-8 flex w-full max-w-md items-center justify-between rounded-2xl bg-white px-5 py-4 text-left shadow-xl transition hover:scale-[1.01]"
          >
            <span>
              <span className="block text-sm text-ink/60">Continue as</span>
              <span className="block text-lg font-semibold">{session.username}</span>
            </span>
            <span className="rounded-lg bg-pink px-3 py-1 font-mono text-lg font-bold tracking-widest text-white">{session.roomCode}</span>
          </button>
        )}

        <nav className="mt-8 grid gap-3 sm:grid-cols-2">
          {tiles.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={`${t.className} rounded-2xl px-6 py-5 text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl`}
            >
              <span className="block font-display text-3xl tracking-wide">{t.label}</span>
              <span className="block text-sm text-white/80">{t.sub}</span>
            </Link>
          ))}
        </nav>

        <Card className="mx-auto mt-10 max-w-md text-center">
          <h2 className="font-display text-3xl tracking-wide">Donate</h2>
          <p className="mt-2 text-sm text-ink/70">
            This beer tasting app is crafted, hosted and maintained by a single developer. If you find value in it, please
            consider a donation of $10 to $20 per user to support ongoing development.
          </p>
          <p className="mt-2 text-sm text-ink/70">
            Bugs, feature requests or just want to chat? <a className="font-medium text-pink underline" href="mailto:gumbosveins@gmail.com">gumbosveins@gmail.com</a>
          </p>
          <DonateForm buttonId="8SQV6FM9JLV86" />
        </Card>
      </main>
    </div>
  )
}
