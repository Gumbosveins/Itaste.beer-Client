import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { BeerImage, Button, Card, HIDDEN } from './ui'
import { BeerSearch } from './BeerSearch'
import { CategoryPicker, type SelectedCategory } from './CategoryPicker'
import { ConfirmDialog } from './ConfirmDialog'
import { api, editRoom, errorMessage } from '../lib/api'
import { counted } from '../lib/scoring'
import type { Dashboard, DashboardBeverage, DashboardUser, ReviewTypeOption } from '../lib/types'

type Tab = 'beers' | 'categories' | 'tasters'

interface EditRoomPanelProps {
  data: Dashboard
  pin: number
  hidden: boolean
  currentId: number | null
  initialTab?: Tab
  onClose: () => void
  onChanged: () => Promise<void>
}

type Pending =
  | { kind: 'beer'; beer: DashboardBeverage; votes: number }
  | { kind: 'user'; user: DashboardUser; votes: number }

export function EditRoomPanel({ data, pin, hidden, currentId, initialTab = 'beers', onClose, onChanged }: EditRoomPanelProps) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [busy, setBusy] = useState(false)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const code = data.code

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, pending])

  const run = async (action: () => Promise<{ message: string }>) => {
    setBusy(true)
    try {
      const result = await action()
      toast.success(result.message)
      await onChanged()
      return true
    } catch (error) {
      toast.error(errorMessage(error))
      return false
    } finally {
      setBusy(false)
    }
  }

  const anyReviews = data.beverages.some((b) => counted(b.reviews).length > 0)
  const tabs: { id: Tab; label: string }[] = [
    { id: 'beers', label: `Beers (${data.beverages.length})` },
    { id: 'categories', label: 'Categories' },
    { id: 'tasters', label: `Tasters (${data.users.length})` },
  ]

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Edit room"
        className="flex h-full w-full max-w-2xl flex-col bg-foam shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 bg-white px-5 py-4 shadow-sm">
          <h2 className="flex-1 font-display text-3xl leading-none">Edit room</h2>
          <Button variant="ghost" onClick={onClose}>Done</Button>
        </header>
        <nav className="flex border-b border-black/10 bg-white">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 border-b-2 px-3 py-3 text-sm font-semibold transition ${tab === t.id ? 'border-pink text-pink' : 'border-transparent text-ink/60 hover:text-ink'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {tab === 'beers' && (
            <BeersTab
              data={data}
              hidden={hidden}
              currentId={currentId}
              busy={busy}
              onMove={(ids) => void run(() => editRoom.reorderBeverages(code, pin, ids))}
              onRemove={(beer) => {
                const votes = counted(beer.reviews).length
                if (votes === 0) {
                  void run(() => editRoom.removeBeverage(code, pin, beer.beverageId))
                } else {
                  setPending({ kind: 'beer', beer, votes })
                }
              }}
            />
          )}
          {tab === 'beers' && (
            <BeerSearch
              excludeIds={new Set(data.beverages.map((b) => b.beverageId))}
              busyId={addingId}
              onAdd={async (beer) => {
                setAddingId(beer.id)
                await run(() => editRoom.addBeverages(code, pin, [beer.id]))
                setAddingId(null)
              }}
            />
          )}

          {tab === 'categories' && (
            <CategoriesTab data={data} locked={anyReviews} busy={busy} onSave={(categories) => run(() => editRoom.updateCategories(code, pin, categories))} />
          )}

          {tab === 'tasters' && (
            <Card>
              {data.users.length === 0 && <p className="text-muted">Nobody has joined yet.</p>}
              <ul className="divide-y divide-black/5">
                {data.users.map((u) => {
                  const votes = data.beverages.filter((b) => b.reviews.some((r) => r.userId === u.id && r.includeInCalculations)).length
                  return (
                    <li key={u.id} className="flex items-center gap-3 py-3">
                      <span className="flex-1">
                        <span className="block font-semibold">{u.username}</span>
                        <span className="block text-xs text-muted">{votes} {votes === 1 ? 'review' : 'reviews'}</span>
                      </span>
                      <Button variant="ghost" disabled={busy} onClick={() => setPending({ kind: 'user', user: u, votes })}>Remove</Button>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </div>
      </aside>

      {pending && (
        <ConfirmDialog
          title={pending.kind === 'beer' ? `Remove ${hidden ? 'this beer' : pending.beer.name}?` : `Remove ${pending.user.username}?`}
          confirmLabel="Remove"
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={async () => {
            const ok = await run(() =>
              pending.kind === 'beer'
                ? editRoom.removeBeverage(code, pin, pending.beer.beverageId)
                : editRoom.removeUser(code, pin, pending.user.id),
            )
            if (ok) {
              setPending(null)
            }
          }}
        >
          {pending.kind === 'beer'
            ? `${pending.votes} ${pending.votes === 1 ? 'review' : 'reviews'} for this beer will be deleted too.`
            : pending.votes > 0
              ? `Their ${pending.votes} ${pending.votes === 1 ? 'review' : 'reviews'} will be deleted and the scores recalculated. They are sent back to the front page.`
              : 'They are sent back to the front page and can join again with the room code.'}
        </ConfirmDialog>
      )}
    </div>
  )
}

interface BeersTabProps {
  data: Dashboard
  hidden: boolean
  currentId: number | null
  busy: boolean
  onMove: (orderedIds: number[]) => void
  onRemove: (beer: DashboardBeverage) => void
}

function BeersTab({ data, hidden, currentId, busy, onMove, onRemove }: BeersTabProps) {
  const ids = data.beverages.map((b) => b.beverageId)
  const movable = (b: DashboardBeverage) => !b.reviewFinished && b.beverageId !== currentId

  const move = (index: number, delta: number) => {
    const target = index + delta
    const next = [...ids]
    ;[next[index], next[target]] = [next[target], next[index]]
    onMove(next)
  }

  return (
    <Card>
      <h3 className="mb-1 font-semibold">Tasting order</h3>
      <p className="mb-3 text-sm text-muted">Finished beers and the beer on the TV stay in place.</p>
      <ol className="divide-y divide-black/5">
        {data.beverages.map((b, i) => {
          const canMove = movable(b)
          const upOk = canMove && i > 0 && movable(data.beverages[i - 1])
          const downOk = canMove && i < data.beverages.length - 1 && movable(data.beverages[i + 1])
          const status = b.reviewFinished ? 'Done' : b.beverageId === currentId ? 'Live' : null
          return (
            <li key={b.beverageId} className="flex items-center gap-3 py-2.5">
              <span className="w-6 text-center font-semibold text-ink/40">{i + 1}</span>
              <BeerImage src={b.imageUrlSm} hidden={hidden} className="h-10 w-10 shrink-0 ring-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{hidden ? HIDDEN : b.name}</span>
                <span className="block truncate text-xs text-muted">{hidden ? HIDDEN : b.manufacturer}</span>
              </span>
              {status && <span className="rounded-full bg-[#f1eeeb] px-2.5 py-1 text-xs font-bold text-muted">{status}</span>}
              <span className="flex gap-1">
                <MoveButton label="Move up" disabled={busy || !upOk} onClick={() => move(i, -1)} up />
                <MoveButton label="Move down" disabled={busy || !downOk} onClick={() => move(i, 1)} />
              </span>
              <Button variant="ghost" className="px-3 py-2" disabled={busy} onClick={() => onRemove(b)}>Remove</Button>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

function MoveButton({ label, disabled, onClick, up = false }: { label: string; disabled: boolean; onClick: () => void; up?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-black/10 transition hover:bg-foam disabled:opacity-30"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={up ? '' : 'rotate-180'}>
        <path d="M6 15l6-6 6 6" />
      </svg>
    </button>
  )
}

interface CategoriesTabProps {
  data: Dashboard
  locked: boolean
  busy: boolean
  onSave: (categories: { id: number; name: string; abbr: string; isNew: boolean; maxValue: number; displayOrder: number }[]) => Promise<boolean>
}

function CategoriesTab({ data, locked, busy, onSave }: CategoriesTabProps) {
  const initial = useMemo<SelectedCategory[]>(
    () =>
      [...data.reviewTypes]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((t) => ({ key: `t${t.reviewId}`, id: t.reviewId, name: t.name, abbr: t.abbr ?? '', maxValue: String(t.maxValue), isNew: false })),
    [data.reviewTypes],
  )
  const [categories, setCategories] = useState<SelectedCategory[]>(initial)
  const [options, setOptions] = useState<ReviewTypeOption[]>([])

  useEffect(() => setCategories(initial), [initial])
  useEffect(() => {
    api
      .getReviewTypes()
      .then((types) => setOptions(types.filter((t) => t.id !== 0)))
      .catch((error: unknown) => toast.error(errorMessage(error)))
  }, [])

  if (locked) {
    return (
      <Card>
        <h3 className="font-semibold">Categories are locked</h3>
        <p className="mt-1 text-sm text-muted">
          Someone has already rated a beer. Each score is calculated with the weights at the time it was given, so the categories can not change mid tasting.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {initial.map((c) => (
            <li key={c.key} className="flex justify-between rounded-lg bg-foam px-3 py-2"><span>{c.name}</span><span className="text-muted">{c.maxValue}%</span></li>
          ))}
        </ul>
      </Card>
    )
  }

  const total = categories.reduce((acc, c) => acc + (Number.parseInt(c.maxValue, 10) || 0), 0)
  const available = options.filter((t) => !categories.some((c) => !c.isNew && c.id === t.id))
  const changed = JSON.stringify(categories.map((c) => [c.id, c.name, c.maxValue])) !== JSON.stringify(initial.map((c) => [c.id, c.name, c.maxValue]))

  return (
    <div className="space-y-4">
      <CategoryPicker available={available} categories={categories} total={total} onChange={setCategories} />
      <div className="flex justify-end">
        <Button
          busy={busy}
          disabled={!changed || total !== 100 || categories.length === 0}
          onClick={() =>
            void onSave(
              categories.map((c, i) => ({ id: c.id, name: c.name, abbr: c.abbr, isNew: c.isNew, displayOrder: i, maxValue: Number.parseInt(c.maxValue, 10) || 0 })),
            )
          }
        >
          Save categories
        </Button>
      </div>
    </div>
  )
}
