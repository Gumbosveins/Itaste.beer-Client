import { Link } from 'react-router'
import { Logo, TopBar } from '../components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-pink">
      <TopBar />
      <main className="px-4 pt-10 text-center text-white">
        <Logo className="w-56" />
        <h1 className="mt-6 font-display text-5xl tracking-wide">Page not found</h1>
        <p className="mt-2 text-white/80">This glass is empty.</p>
        <Link to="/" className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-pink shadow">Back home</Link>
      </main>
    </div>
  )
}
