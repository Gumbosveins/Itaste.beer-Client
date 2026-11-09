import { useState, type ReactNode } from 'react'
import type { Beer } from '../lib/types'
import { BeerImage } from './ui'
import { ChevronIcon } from './icons'

interface BeerRowProps {
  beer: Beer
  index?: number
  action: ReactNode
  expandable?: boolean
}

export function BeerRow({ beer, index, action, expandable = false }: BeerRowProps) {
  const [open, setOpen] = useState(false)
  const rating = beer.untappedRating > 0 ? beer.untappedRating.toFixed(2) : 'N/A'

  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        {index !== undefined && <span className="w-6 text-lg font-semibold text-ink/40">{index}</span>}
        <BeerImage src={beer.lableSM} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{beer.name}</div>
          <div className="truncate text-sm text-ink/70">{beer.brewery?.name}</div>
          <div className="flex flex-wrap gap-x-3 text-xs text-ink/50">
            <span>{beer.type}</span>
            <span>ABV {beer.percent}%</span>
            <span>IBU {beer.ibu > 0 ? beer.ibu : 'N/A'}</span>
            <span>Untappd {rating}</span>
          </div>
        </div>
        {expandable && beer.description && (
          <button type="button" onClick={() => setOpen(!open)} className="rounded-lg p-2 text-ink/50 hover:bg-black/5" aria-label="Description" aria-expanded={open}>
            <ChevronIcon open={open} />
          </button>
        )}
        {action}
      </div>
      {open && beer.description && <p className="mt-2 pl-[4.25rem] text-sm text-ink/70">{beer.description}</p>}
    </li>
  )
}
