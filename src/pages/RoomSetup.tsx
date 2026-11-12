import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { BeerImage, Button, Card, Field, TopBar } from '../components/ui'
import { BeerRow } from '../components/BeerRow'
import { BeerSearch } from '../components/BeerSearch'
import { CategoryPicker, ADD_OWN, type SelectedCategory } from '../components/CategoryPicker'
import { api, errorMessage } from '../lib/api'
import { readSession } from '../lib/session'
import type { Beer, ReviewTypeOption } from '../lib/types'

type Tab = 'beers' | 'categories' | 'finish'


export default function RoomSetup() {
  const { roomCode = '' } = useParams()
  const navigate = useNavigate()
  const session = readSession()
  const [pin, setPin] = useState(session.roomCode === roomCode ? (session.pin ?? '') : '')

  const [tab, setTab] = useState<Tab>('beers')
  const [beers, setBeers] = useState<Beer[]>([])

  const [typeOptions, setTypeOptions] = useState<ReviewTypeOption[]>([])
  const [categories, setCategories] = useState<SelectedCategory[]>([])
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    api
      .getReviewTypes()
      .then((types) => setTypeOptions(types.filter((t) => t.id !== ADD_OWN)))
      .catch((error: unknown) => toast.error(errorMessage(error)))
  }, [])

  const selectedIds = useMemo(() => new Set(beers.map((b) => b.id)), [beers])
  const total = categories.reduce((acc, c) => acc + (Number.parseInt(c.maxValue, 10) || 0), 0)
  const availableTypes = typeOptions.filter((t) => !categories.some((c) => !c.isNew && c.id === t.id))

  const pinValid = /^\d{4}$/.test(pin)
  const problems = [
    beers.length === 0 && 'Add at least one beer',
    categories.length === 0 && 'Add at least one rating category',
    categories.length > 0 && total !== 100 && `Category weights add up to ${total}, they must add up to 100`,
    !pinValid && 'Enter the room pin',
  ].filter((p): p is string => Boolean(p))

  const finish = async () => {
    if (problems.length > 0) {
      toast.error(problems[0])
      return
    }
    setFinishing(true)
    try {
      await api.finishRoomCreation({
        roomCode,
        pin: Number(pin),
        beers: beers.map((b, i) => ({ id: b.id, displayOrder: i })),
        categories: categories.map((c, i) => ({
          id: c.id,
          name: c.name,
          abbr: c.abbr,
          isNew: c.isNew,
          displayOrder: i,
          maxValue: Number.parseInt(c.maxValue, 10) || 0,
        })),
      })
      navigate(`/dashboard/${roomCode}/${pin}`)
    } catch (error) {
      toast.error(errorMessage(error))
      setFinishing(false)
    }
  }

  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: 'beers', label: 'Beers', badge: String(beers.length) },
    { id: 'categories', label: 'Categories', badge: `${total}%` },
    { id: 'finish', label: 'Finish' },
  ]

  return (
    <div className="min-h-screen bg-foam">
      <TopBar title={<>Room setup <span className="ml-2 rounded bg-white/20 px-2 py-0.5 font-mono tracking-widest">{roomCode}</span></>} />
      <nav className="sticky top-14 z-10 flex border-b border-black/10 bg-white">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 border-b-2 px-3 py-3 text-sm font-semibold transition ${tab === t.id ? 'border-pink text-pink' : 'border-transparent text-ink/60 hover:text-ink'}`}
          >
            {t.label}
            {t.badge && <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-xs">{t.badge}</span>}
          </button>
        ))}
      </nav>

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-6">
        {tab === 'beers' && (
          <div className="space-y-6">
            {beers.length > 0 && (
              <Card>
                <h2 className="mb-3 font-semibold">Your tasting order</h2>
                <ol className="divide-y divide-black/5">
                  {beers.map((beer, i) => (
                    <BeerRow key={beer.id} beer={beer} index={i + 1} action={<Button variant="ghost" onClick={() => setBeers(beers.filter((b) => b.id !== beer.id))}>Remove</Button>} />
                  ))}
                </ol>
              </Card>
            )}

            <BeerSearch excludeIds={selectedIds} onAdd={(beer) => setBeers([...beers, beer])} />
          </div>
        )}

        {tab === 'categories' && (
          <CategoryPicker
            available={availableTypes}
            categories={categories}
            total={total}
            onChange={setCategories}
          />
        )}

        {tab === 'finish' && (
          <Card className="text-center">
            <h2 className="font-display text-4xl tracking-wide">Finish your room</h2>
            <div className="mx-auto mt-4 flex max-w-sm flex-wrap justify-center gap-2">
              {beers.slice(0, 12).map((b) => <BeerImage key={b.id} src={b.lableSM} className="h-10 w-10" />)}
            </div>
            <p className="mt-3 text-ink/70">{beers.length} beers, {categories.length} categories ({total}%)</p>
            {!(session.roomCode === roomCode && session.pin) && (
              <div className="mx-auto mt-4 max-w-xs text-left">
                <Field label="Room pin" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" />
              </div>
            )}
            {problems.length > 0 && (
              <ul className="mx-auto mt-4 max-w-sm space-y-1 text-sm text-red-600">
                {problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            )}
            <p className="mx-auto mt-6 max-w-lg text-sm text-ink/60">
              This app is built and hosted by a single developer. If you enjoy it, please consider a donation from the front page.
            </p>
            <Button variant="amber" className="mt-6 px-10 text-base" busy={finishing} onClick={() => void finish()} disabled={problems.length > 0}>
              Create room and open dashboard
            </Button>
          </Card>
        )}
      </main>
    </div>
  )
}
