import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { api } from '../api/client.js'

let cachedPostcodes = null
let loadPromise = null

function loadPostcodes() {
  if (cachedPostcodes) return Promise.resolve(cachedPostcodes)
  if (!loadPromise) {
    loadPromise = api
      .listPostcodes()
      .then((d) => {
        cachedPostcodes = d.results || []
        return cachedPostcodes
      })
      .catch((err) => {
        loadPromise = null
        throw err
      })
  }
  return loadPromise
}

function optionLabel(row) {
  return [row.outcode, row.town].filter(Boolean).join(' — ')
}

export default function PostcodeInput({
  value,
  onChange,
  placeholder = 'Search postcode…',
  className = '',
  disabled,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState(cachedPostcodes || [])
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  const selected = useMemo(
    () => options.find((o) => o.outcode === String(value || '').toUpperCase()) || null,
    [options, value],
  )
  const inputValue = open ? query : selected ? optionLabel(selected) : value || ''

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current?.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (options.length) return
    setLoading(true)
    loadPostcodes()
      .then((list) => setOptions(list))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false))
  }, [options.length])

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase()
    if (!q) return options.slice(0, 80)
    return options
      .filter(
        (o) =>
          o.outcode.includes(q) ||
          (o.town && o.town.toUpperCase().includes(q)) ||
          (o.region && o.region.toUpperCase().includes(q)),
      )
      .slice(0, 80)
  }, [options, query])

  function pick(row) {
    onChange(row.outcode)
    setQuery('')
    setOpen(false)
  }

  const shellClass =
    className ||
    'flex w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus-within:border-blue focus-within:ring-2 focus-within:ring-blue/20'

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`${shellClass} ${disabled ? 'opacity-60' : 'cursor-text'}`}
        onClick={() => {
          if (disabled) return
          setOpen(true)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
      >
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          autoComplete="off"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setQuery(e.target.value.toUpperCase())
            setOpen(true)
            if (value) onChange('')
          }}
          onFocus={() => {
            if (!disabled) setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHighlight((h) => Math.max(h - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              if (open && filtered[highlight]) pick(filtered[highlight])
            } else if (e.key === 'Escape') {
              setOpen(false)
              setQuery('')
            }
          }}
          className="min-w-0 flex-1 border-0 bg-transparent uppercase outline-none placeholder:normal-case"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
              setQuery('')
              setOpen(true)
            }}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="size-4" />
          </button>
        ) : null}
        <ChevronDown className={`size-4 shrink-0 text-slate-400 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && !disabled ? (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {loading ? <li className="px-3 py-2 text-sm text-slate-500">Loading…</li> : null}
          {!loading && !filtered.length ? (
            <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
          ) : null}
          {filtered.map((r, i) => (
            <li key={r.outcode}>
              <button
                type="button"
                className={`flex w-full gap-2 px-3 py-2 text-left text-sm ${
                  i === highlight ? 'bg-blue/10' : 'hover:bg-slate-50'
                }`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(r)}
              >
                <span className="font-bold text-navy">{r.outcode}</span>
                <span className="truncate text-slate-500">
                  {[r.town, r.region].filter(Boolean).join(', ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
