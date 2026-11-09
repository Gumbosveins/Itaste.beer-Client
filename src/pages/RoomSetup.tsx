import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { BeerImage, Button, Card, Field, Spinner, TopBar } from '../components/ui'
import { BeerRow } from '../components/BeerRow'
import { api, errorMessage } from '../lib/api'
import { readSession } from '../lib/session'
import type { Beer, ReviewTypeOption } from '../lib/types'

type Tab = 'beers' | 'categories' | 'finish'

interface SelectedCategory {
  key: string
  id: number
  name: string
  abbr: string
  maxValue: string
  isNew: boolean
}

const ADD_OWN = 0

export default function RoomSetup() {
  const { roomCode = '' } = useParams()
  const navigate = useNavigate()
  const session = readSession()
  const [pin, setPin] = useState(session.roomCode === roomCode ? (session.pin ?? '') : '')

  const [tab, setTab] = useState<Tab>('beers')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Beer[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
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

  const search = async (force: boolean) => {
    const q = query.trim()
    if (!q) {
      toast.error('Type a beer or brewery name first')
      return
    }
    setSearching(true)
    try {
      setResults(await api.searchForBeers(q, force))
      setSearched(true)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSearching(false)
    }
  }

  const selectedIds = useMemo(() => new Set(beers.map((b) => b.id)), [beers])
  const visibleResults = results.filter((b) => !selectedIds.has(b.id))
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

            <Card>
              <h2 className="text-center text-lg font-semibold">Find the beers for your room</h2>
              <p className="mt-1 text-center text-sm text-ink/60">Can't find it? Search with the brewery and the beer name, or search Untappd directly.</p>
              <form
                className="mt-4 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault()
                  void search(false)
                }}
              >
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Beer or brewery name"
                  className="flex-1 rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-pink focus:ring-4 focus:ring-pink/15"
                />
                <Button type="submit" busy={searching}>Search</Button>
                <Button type="button" variant="amber" onClick={() => void search(true)} disabled={searching}>Search Untappd</Button>
              </form>
            </Card>

            {searching && (
              <div className="flex justify-center text-pink"><Spinner className="h-8 w-8" /></div>
            )}
            {!searching && searched && results.length === 0 && (
              <p className="text-center text-ink/60">No beers found. Try Search Untappd.</p>
            )}
            {!searching && visibleResults.length > 0 && (
              <Card>
                <ul className="divide-y divide-black/5">
                  {visibleResults.map((beer) => (
                    <BeerRow key={beer.id} beer={beer} expandable action={<Button onClick={() => setBeers([...beers, beer])}>Add</Button>} />
                  ))}
                </ul>
              </Card>
            )}
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

interface CategoryPickerProps {
  available: ReviewTypeOption[]
  categories: SelectedCategory[]
  total: number
  onChange: (next: SelectedCategory[]) => void
}

function CategoryPicker({ available, categories, total, onChange }: CategoryPickerProps) {
  const [typeId, setTypeId] = useState<string>('')
  const [newName, setNewName] = useState('')
  const [newAbbr, setNewAbbr] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const addingOwn = typeId === String(ADD_OWN)

  const canAdd = typeId !== '' && (!addingOwn || (newName.trim() && newAbbr.trim()))

  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!canAdd) {
      return
    }
    const existing = available.find((t) => String(t.id) === typeId)
    const category: SelectedCategory = existing
      ? { key: `t${existing.id}`, id: existing.id, name: existing.name, abbr: '', maxValue, isNew: false }
      : { key: `n${Date.now()}`, id: ADD_OWN, name: newName.trim(), abbr: newAbbr.trim().toUpperCase(), maxValue, isNew: true }
    onChange([...categories, category])
    setTypeId('')
    setNewName('')
    setNewAbbr('')
    setMaxValue('')
  }

  const update = (key: string, value: string) =>
    onChange(categories.map((c) => (c.key === key ? { ...c, maxValue: value.replace(/\D/g, '').slice(0, 3) } : c)))

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-center text-lg font-semibold">How do you want to rate the beers?</h2>
        <p className="mt-1 text-center text-sm text-ink/60">Each taster scores every category 0 to 10. The weights decide how much each category counts and must add up to 100.</p>
        <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/80">Category</span>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-pink"
            >
              <option value="" disabled>Choose a category</option>
              {available.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              <option value={ADD_OWN}>Add my own</option>
            </select>
          </label>
          <Field label="Weight %" value={maxValue} onChange={(e) => setMaxValue(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" placeholder={String(Math.max(0, 100 - total))} />
          <Button type="submit" disabled={!canAdd}>Add</Button>
          {addingOwn && (
            <div className="grid gap-3 sm:col-span-3 sm:grid-cols-2">
              <Field label="Category name" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} />
              <Field label="Abbreviation" value={newAbbr} onChange={(e) => setNewAbbr(e.target.value)} maxLength={6} hint="Shown on the dashboard, e.g. TST" />
            </div>
          )}
        </form>
      </Card>

      {categories.length > 0 && (
        <Card>
          <ol className="divide-y divide-black/5">
            {categories.map((c, i) => (
              <li key={c.key} className="flex items-center gap-3 py-3">
                <span className="w-6 text-ink/40">{i + 1}</span>
                <span className="flex-1 font-medium">{c.name}{c.isNew && <span className="ml-2 text-xs text-ink/50">({c.abbr})</span>}</span>
                <input
                  value={c.maxValue}
                  onChange={(e) => update(c.key, e.target.value)}
                  inputMode="numeric"
                  aria-label={`${c.name} weight`}
                  className="w-20 rounded-lg border border-black/10 px-3 py-2 text-right outline-none focus:border-pink"
                />
                <span className="text-ink/50">%</span>
                <Button variant="ghost" onClick={() => onChange(categories.filter((x) => x.key !== c.key))}>Remove</Button>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex justify-end border-t border-black/10 pt-3 text-lg font-semibold">
            Total: <span className={`ml-2 ${total === 100 ? 'text-emerald-600' : 'text-red-600'}`}>{total}%</span>
          </div>
        </Card>
      )}
    </div>
  )
}
