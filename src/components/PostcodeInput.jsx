import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Plus, X } from 'lucide-react'
import { api } from '../api/client.js'

let cachedPostcodes = null
let loadPromise = null

/** Call after CRM create/update/delete so dropdowns pick up changes. */
export function clearPostcodeCache() {
  cachedPostcodes = null
  loadPromise = null
}

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

function normalizePostcode(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
}

/** Searchable postcode dropdown — pick from list or add a manual value. */
export default function PostcodeInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Search postcode…',
  className = '',
  disabled,
  allowCustom = true,
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

  const typed = normalizePostcode(query)
  const hasExactOutcode = options.some((o) => o.outcode === typed)
  const showCustom = allowCustom && typed.length >= 2 && !hasExactOutcode
  const listLength = filtered.length + (showCustom ? 1 : 0)

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

  useEffect(() => {
    setHighlight(0)
  }, [query, open])

  function pick(row) {
    onChange(row.outcode)
    onSelect?.(row)
    setQuery('')
    setOpen(false)
  }

  function pickCustom(raw) {
    const v = normalizePostcode(raw)
    if (!v) return
    onChange(v)
    onSelect?.({ outcode: v, town: null, region: null, custom: true })
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
          role="combobox"
          aria-expanded={open}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setQuery(e.target.value.toUpperCase())
            setOpen(true)
            if (value) onChange('')
          }}
          onFocus={() => {
            if (disabled) return
            setOpen(true)
            if (selected) setQuery('')
            else if (value) setQuery(String(value).toUpperCase())
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
              setHighlight((h) => Math.min(h + 1, Math.max(listLength - 1, 0)))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHighlight((h) => Math.max(h - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              if (!open) {
                setOpen(true)
                return
              }
              if (showCustom && highlight === 0) {
                pickCustom(typed)
                return
              }
              const idx = showCustom ? highlight - 1 : highlight
              if (filtered[idx]) pick(filtered[idx])
              else if (showCustom) pickCustom(typed)
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
              onSelect?.(null)
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
          {loading ? (
            <li className="grid place-items-center px-3 py-3">
              <div className="size-5 animate-spin rounded-full border-2 border-blue border-t-transparent" />
            </li>
          ) : null}
          {!loading && showCustom ? (
            <li>
              <button
                type="button"
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                  highlight === 0 ? 'bg-blue/10' : 'hover:bg-slate-50'
                }`}
                onMouseEnter={() => setHighlight(0)}
                onClick={() => pickCustom(typed)}
              >
                <Plus className="size-4 shrink-0 text-blue" />
                <span className="text-slate-600">
                  Use <span className="font-bold text-navy">{typed}</span>
                  <span className="ml-1 text-slate-400">(add manually)</span>
                </span>
              </button>
            </li>
          ) : null}
          {!loading && !filtered.length && !showCustom ? (
            <li className="px-3 py-2 text-sm text-slate-500">
              {query ? 'No matches' : 'Start typing a postcode or town'}
            </li>
          ) : null}
          {filtered.map((r, i) => {
            const optionIndex = showCustom ? i + 1 : i
            return (
              <li key={r.outcode}>
                <button
                  type="button"
                  className={`flex w-full gap-2 px-3 py-2 text-left text-sm ${
                    optionIndex === highlight ? 'bg-blue/10' : 'hover:bg-slate-50'
                  }`}
                  onMouseEnter={() => setHighlight(optionIndex)}
                  onClick={() => pick(r)}
                >
                  <span className="font-bold text-navy">{r.outcode}</span>
                  <span className="truncate text-slate-500">
                    {[r.town, r.region].filter(Boolean).join(', ')}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
