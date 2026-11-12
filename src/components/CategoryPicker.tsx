import { useState, type FormEvent } from 'react'
import { Button, Card, Field } from './ui'
import type { ReviewTypeOption } from '../lib/types'

export const ADD_OWN = 0

export interface SelectedCategory {
  key: string
  id: number
  name: string
  abbr: string
  maxValue: string
  isNew: boolean
}

export interface CategoryPickerProps {
  available: ReviewTypeOption[]
  categories: SelectedCategory[]
  total: number
  onChange: (next: SelectedCategory[]) => void
}

export function CategoryPicker({ available, categories, total, onChange }: CategoryPickerProps) {
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
