import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button, Card, Spinner } from './ui'
import { BeerRow } from './BeerRow'
import { api, errorMessage } from '../lib/api'
import type { Beer } from '../lib/types'

interface BeerSearchProps {
  excludeIds: Set<number>
  onAdd: (beer: Beer) => void | Promise<void>
  busyId?: number | null
}

/** Search the beer database or Untappd and add results to a room */
export function BeerSearch({ excludeIds, onAdd, busyId = null }: BeerSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Beer[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

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

  const visible = results.filter((b) => !excludeIds.has(b.id))

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-center text-lg font-semibold">Find beers</h2>
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

      {searching && <div className="flex justify-center text-pink"><Spinner className="h-8 w-8" /></div>}
      {!searching && searched && results.length === 0 && <p className="text-center text-ink/60">No beers found. Try Search Untappd.</p>}
      {!searching && visible.length > 0 && (
        <Card>
          <ul className="divide-y divide-black/5">
            {visible.map((beer) => (
              <BeerRow key={beer.id} beer={beer} expandable action={<Button busy={busyId === beer.id} onClick={() => void onAdd(beer)}>Add</Button>} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
