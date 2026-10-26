import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { api } from '../api/client.js'
import {
  Button,
  ErrorBanner,
  Input,
  Loading,
  PageHeader,
  RefreshButton,
} from '../components/ui.jsx'

const MAX_ITEMS = 6

function OrderedPicker({
  label,
  items,
  selectedIds,
  onChange,
  searchPlaceholder = 'Search…',
}) {
  const [q, setQ] = useState('')
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const selected = selectedIds.map((id) => byId.get(id)).filter(Boolean)
  const available = useMemo(() => {
    const term = q.trim().toLowerCase()
    const picked = new Set(selectedIds)
    return items.filter((i) => {
      if (picked.has(i.id)) return false
      if (!term) return true
      return (
        i.name?.toLowerCase().includes(term) ||
        i.slug?.toLowerCase().includes(term)
      )
    })
  }, [items, selectedIds, q])

  function add(id) {
    if (selectedIds.includes(id) || selectedIds.length >= MAX_ITEMS) return
    onChange([...selectedIds, id])
  }

  function remove(id) {
    onChange(selectedIds.filter((x) => x !== id))
  }

  function move(id, dir) {
    const idx = selectedIds.indexOf(id)
    if (idx < 0) return
    const next = idx + dir
    if (next < 0 || next >= selectedIds.length) return
    const copy = [...selectedIds]
    ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
    onChange(copy)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-navy">{label}</h3>
        <span className="text-xs font-semibold text-slate-500">
          {selectedIds.length}/{MAX_ITEMS} selected
        </span>
      </div>

      <div className="mb-4 space-y-2">
        {selected.length ? (
          selected.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="size-10 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-200 text-[10px] text-slate-400">
                  —
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">
                  {index + 1}. {item.name}
                </p>
              </div>
              <button
                type="button"
                className="rounded p-1 text-slate-500 hover:bg-white hover:text-navy"
                onClick={() => move(item.id, -1)}
                aria-label="Move up"
                disabled={index === 0}
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                className="rounded p-1 text-slate-500 hover:bg-white hover:text-navy"
                onClick={() => move(item.id, 1)}
                aria-label="Move down"
                disabled={index === selected.length - 1}
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                className="rounded p-1 text-warn hover:bg-white"
                onClick={() => remove(item.id)}
                aria-label="Remove"
              >
                <X className="size-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
            No items selected yet. Pick from the list below.
          </p>
        )}
      </div>

      <input
        className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
        placeholder={searchPlaceholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-100">
        {available.slice(0, 40).map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={selectedIds.length >= MAX_ITEMS}
            onClick={() => add(item.id)}
            className="flex w-full items-center gap-2 border-b border-slate-50 px-2.5 py-2 text-left text-sm hover:bg-blue/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="size-8 rounded object-cover" />
            ) : (
              <span className="size-8 rounded bg-slate-100" />
            )}
            <span className="min-w-0 flex-1 truncate font-medium text-navy">{item.name}</span>
            <Plus className="size-4 shrink-0 text-blue" />
          </button>
        ))}
        {!available.length ? (
          <p className="px-3 py-4 text-center text-xs text-slate-500">No matches.</p>
        ) : null}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [popularTitle, setPopularTitle] = useState('Popular Services')
  const [popularCategoriesTitle, setPopularCategoriesTitle] = useState('Popular Categories')
  const [popularServiceIds, setPopularServiceIds] = useState([])
  const [popularCategoryIds, setPopularCategoryIds] = useState([])
  const [homeContent, setHomeContent] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [settingsRes, svcRes, catRes] = await Promise.all([
        api.getSettings(),
        api.manageServices().catch(() => api.getServices()),
        api.manageCategories().catch(() => api.getCategories()),
      ])
      const settings = settingsRes.settings || []
      const home = settings.find((s) => s.key === 'home_content')?.value || {}
      setHomeContent(home && typeof home === 'object' ? home : {})

      const svcList = (svcRes.services || []).filter((s) => s.isActive !== false)
      const catList = (catRes.categories || []).filter((c) => c.isActive !== false)
      setServices(svcList)
      setCategories(catList)

      setPopularTitle(home.popularTitle || 'Popular Services')
      setPopularCategoriesTitle(home.popularCategoriesTitle || 'Popular Categories')

      const svcIds = Array.isArray(home.popularServiceIds)
        ? home.popularServiceIds.filter((id) => svcList.some((s) => s.id === id)).slice(0, MAX_ITEMS)
        : []
      const catIds = Array.isArray(home.popularCategoryIds)
        ? home.popularCategoryIds.filter((id) => catList.some((c) => c.id === id)).slice(0, MAX_ITEMS)
        : []

      setPopularServiceIds(
        svcIds.length ? svcIds : svcList.slice(0, MAX_ITEMS).map((s) => s.id),
      )
      setPopularCategoryIds(
        catIds.length ? catIds : catList.slice(0, MAX_ITEMS).map((c) => c.id),
      )
    } catch (err) {
      setError(err.message || 'Failed to load home page settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFlash('')
    try {
      const value = {
        ...homeContent,
        popularTitle: popularTitle.trim() || 'Popular Services',
        popularCategoriesTitle: popularCategoriesTitle.trim() || 'Popular Categories',
        popularServiceIds: popularServiceIds.slice(0, MAX_ITEMS),
        popularCategoryIds: popularCategoryIds.slice(0, MAX_ITEMS),
      }
      await api.upsertSetting({ key: 'home_content', value })
      setHomeContent(value)
      setFlash('Home page popular sections saved.')
      setTimeout(() => setFlash(''), 2200)
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Home page"
        subtitle="Choose up to 6 popular services and 6 popular categories shown on the public homepage."
        actions={<RefreshButton onClick={load} loading={loading} />}
      />
      <ErrorBanner message={error} />
      {flash ? <p className="mb-3 text-sm font-semibold text-ok">{flash}</p> : null}

      {loading ? (
        <Loading className="py-10" />
      ) : (
        <form className="space-y-6" onSubmit={save}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Popular services title"
              value={popularTitle}
              onChange={(e) => setPopularTitle(e.target.value)}
            />
            <Input
              label="Popular categories title"
              value={popularCategoriesTitle}
              onChange={(e) => setPopularCategoriesTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <OrderedPicker
              label="Popular services"
              items={services}
              selectedIds={popularServiceIds}
              onChange={setPopularServiceIds}
              searchPlaceholder="Search services to add…"
            />
            <OrderedPicker
              label="Popular categories"
              items={categories}
              selectedIds={popularCategoryIds}
              onChange={setPopularCategoryIds}
              searchPlaceholder="Search categories to add…"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save home page'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
