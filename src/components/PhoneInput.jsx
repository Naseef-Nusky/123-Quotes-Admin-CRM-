import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import {
  COUNTRY_DIAL_CODES,
  DEFAULT_COUNTRY_CODE,
} from '../data/countryDialCodes'

function labelFor(c) {
  return `${c.name} (+${c.dial})`
}

/**
 * Professional searchable country dial-code select (UK default).
 */
export default function PhoneInput({
  dialCode = DEFAULT_COUNTRY_CODE,
  onDialCodeChange,
  value,
  onChange,
  disabled,
}) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef(null)
  const searchRef = useRef(null)

  const selected =
    COUNTRY_DIAL_CODES.find((c) => c.code === dialCode) ||
    COUNTRY_DIAL_CODES.find((c) => c.code === DEFAULT_COUNTRY_CODE)

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return COUNTRY_DIAL_CODES
    return COUNTRY_DIAL_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dial.includes(q.replace(/^\+/, '')),
    )
  }, [filter])

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current?.contains(e.target)) {
        setOpen(false)
        setFilter('')
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    setHighlight(0)
  }, [filter, open])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0)
  }, [open])

  function pick(c) {
    onDialCodeChange?.(c.code)
    setOpen(false)
    setFilter('')
  }

  function onKeyDown(e) {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlight]) pick(filtered[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setFilter('')
    }
  }

  return (
    <div className="flex items-stretch gap-2">
      <div ref={wrapRef} className="relative w-[148px] shrink-0 sm:w-[168px]">
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (disabled) return
            setOpen((v) => !v)
            setFilter('')
          }}
          onKeyDown={onKeyDown}
          className="flex h-full w-full items-center justify-between gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-left text-sm font-semibold text-navy outline-none transition hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        >
          <span className="truncate">+{selected?.dial}</span>
          <ChevronDown
            className={`size-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
            strokeWidth={2}
          />
        </button>

        {open ? (
          <div className="absolute left-0 z-40 mt-1 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#d6e4f0] bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#d6e4f0] px-3 py-2">
              <Search className="size-4 shrink-0 text-slate-400" strokeWidth={2} />
              <input
                ref={searchRef}
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search country…"
                className="w-full border-0 bg-transparent py-1 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <ul role="listbox" className="max-h-56 overflow-auto py-1">
              {!filtered.length ? (
                <li className="px-3 py-3 text-sm text-muted">No countries found</li>
              ) : null}
              {filtered.map((c, i) => {
                const active = c.code === selected?.code
                const focused = i === highlight
                return (
                  <li key={`${c.code}-${c.dial}`} role="option" aria-selected={active}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition ${
                        focused || active ? 'bg-primary/10' : 'hover:bg-[#eef7fc]'
                      }`}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => pick(c)}
                    >
                      <span className="min-w-0 truncate font-medium text-navy">{c.name}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-slate">
                        +{c.dial}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <input
        type="tel"
        inputMode="numeric"
        disabled={disabled}
        className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        placeholder="Mobile number"
        aria-label={selected ? `Number for ${labelFor(selected)}` : 'Mobile number'}
      />
    </div>
  )
}
