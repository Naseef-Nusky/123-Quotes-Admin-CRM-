import { Plus, Trash2 } from 'lucide-react'
import { Button, Input } from './ui.jsx'

export function defaultUnlockTiers() {
  return [
    { fromViews: 0, toViews: 4, tokenCost: 1 },
    { fromViews: 5, toViews: '', tokenCost: 2 },
  ]
}

/**
 * Accepts legacy { afterViews, tokenCost } or { fromViews, toViews, tokenCost }.
 * UI uses inclusive from/to; blank toViews = unlimited.
 */
export function normalizeUnlockTiersForUi(raw) {
  let list = raw
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list)
    } catch {
      list = null
    }
  }
  if (!Array.isArray(list) || !list.length) return defaultUnlockTiers()

  // Legacy afterViews → from/to ranges
  if (list.some((t) => t.afterViews != null && t.fromViews == null)) {
    const sorted = [...list]
      .map((t) => ({
        afterViews: Math.max(0, Math.floor(Number(t.afterViews) || 0)),
        tokenCost: Math.max(1, Math.floor(Number(t.tokenCost) || 1)),
      }))
      .sort((a, b) => a.afterViews - b.afterViews)
    const byView = new Map()
    for (const t of sorted) byView.set(t.afterViews, t)
    const points = [...byView.values()].sort((a, b) => a.afterViews - b.afterViews)
    if (!points.some((t) => t.afterViews === 0)) {
      points.unshift({ afterViews: 0, tokenCost: 1 })
    }
    return points.map((t, i) => {
      const next = points[i + 1]
      return {
        fromViews: t.afterViews,
        toViews: next ? next.afterViews - 1 : '',
        tokenCost: t.tokenCost,
      }
    })
  }

  return list.map((t) => ({
    fromViews: Math.max(0, Math.floor(Number(t.fromViews) || 0)),
    toViews:
      t.toViews === '' || t.toViews == null || t.toViews === undefined
        ? ''
        : Math.max(0, Math.floor(Number(t.toViews) || 0)),
    tokenCost: Math.max(1, Math.floor(Number(t.tokenCost) || 1)),
  }))
}

function parseToViews(value) {
  if (value === '' || value == null || value === undefined) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.floor(n))
}

/**
 * Validate from/to ranges.
 * - From must be <= To (when To is set)
 * - First from must be 0
 * - Only last row may leave To blank (unlimited)
 * - Next From must be previous To + 1
 */
export function validateUnlockTiers(tiers) {
  const rowErrors = {}
  const errors = []
  const list = Array.isArray(tiers) ? tiers : []

  if (!list.length) {
    return { valid: false, errors: ['Add at least one token option.'], rowErrors }
  }

  list.forEach((tier, index) => {
    const from = Math.floor(Number(tier.fromViews))
    const to = parseToViews(tier.toViews)
    const tokens = Math.floor(Number(tier.tokenCost))
    const isLast = index === list.length - 1
    let msg = ''

    if (!Number.isFinite(from) || from < 0) {
      msg = 'From views must be 0 or greater.'
    } else if (index === 0 && from !== 0) {
      msg = 'First option must start from 0 views.'
    } else if (!Number.isFinite(tokens) || tokens < 1) {
      msg = 'Tokens must be at least 1.'
    } else if (to == null && !isLast) {
      msg = 'Set a To views value, or make this the last option.'
    } else if (to != null && from > to) {
      msg = `From (${from}) must be before or equal to To (${to}).`
    }

    if (!msg && index > 0) {
      const prev = list[index - 1]
      const prevFrom = Math.floor(Number(prev.fromViews))
      const prevTo = parseToViews(prev.toViews)
      if (prevTo == null) {
        msg = 'Previous option already ends at unlimited — remove or set its To views first.'
      } else if (Number.isFinite(prevTo) && from !== prevTo + 1) {
        msg = `From must be ${prevTo + 1} (right after previous To ${prevTo}).`
      } else if (Number.isFinite(prevFrom) && from <= prevFrom) {
        msg = `From must be greater than previous From (${prevFrom}).`
      }
    }

    if (msg) {
      rowErrors[index] = msg
      errors.push(`Option ${index + 1}: ${msg}`)
    }
  })

  return { valid: errors.length === 0, errors, rowErrors }
}

/** Persist format used by backend (compatible with afterViews + from/to). */
export function serializeUnlockTiers(tiers) {
  const check = validateUnlockTiers(tiers)
  if (!check.valid) {
    const err = new Error(check.errors[0] || 'Invalid token options')
    err.validation = check
    throw err
  }

  const rows = tiers.map((t) => {
    const fromViews = Math.max(0, Math.floor(Number(t.fromViews) || 0))
    const toViews = parseToViews(t.toViews)
    return {
      fromViews,
      toViews,
      tokenCost: Math.max(1, Math.floor(Number(t.tokenCost) || 1)),
      afterViews: fromViews,
    }
  })

  return rows
}

export function UnlockTokenTiersForm({
  tiers,
  onChange,
  showMaxUnlocks = false,
  maxUnlocksPerLead,
  onMaxUnlocksChange,
}) {
  const { rowErrors, errors, valid } = validateUnlockTiers(tiers)

  function updateRow(index, field, value) {
    onChange(
      tiers.map((row, i) => {
        if (i !== index) return row
        const next = { ...row, [field]: value }
        // Keep from before to while typing when possible
        if (field === 'fromViews') {
          const from = Math.floor(Number(value))
          const to = parseToViews(row.toViews)
          if (Number.isFinite(from) && to != null && from > to) {
            next.toViews = from
          }
        }
        if (field === 'toViews' && value !== '') {
          const to = Math.floor(Number(value))
          const from = Math.floor(Number(row.fromViews) || 0)
          if (Number.isFinite(to) && to < from) {
            // allow typing but validation will catch; don't force from down for first row
          }
        }
        return next
      }),
    )
  }

  function addOption() {
    const check = validateUnlockTiers(tiers)
    if (!check.valid) return

    const last = tiers[tiers.length - 1]
    const lastTo = parseToViews(last?.toViews)
    const nextFrom =
      lastTo != null ? lastTo + 1 : (Number(last?.fromViews) || 0) + 5
    const next = [...tiers]
    if (last && parseToViews(last.toViews) == null) {
      next[next.length - 1] = { ...last, toViews: nextFrom - 1 }
    }
    onChange([
      ...next,
      { fromViews: nextFrom, toViews: '', tokenCost: (Number(last?.tokenCost) || 1) + 1 },
    ])
  }

  function removeOption(index) {
    if (tiers.length <= 1) return
    const next = tiers.filter((_, i) => i !== index)
    if (Number(next[0]?.fromViews) !== 0) {
      next[0] = { ...next[0], fromViews: 0 }
    }
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-3 font-semibold">From views</th>
              <th className="py-2 pr-3 font-semibold">To views</th>
              <th className="py-2 pr-3 font-semibold">Tokens</th>
              <th className="py-2 font-semibold">Option</th>
              <th className="py-2 w-12" />
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, index) => {
              const fromNum = Math.floor(Number(tier.fromViews) || 0)
              const toNum = parseToViews(tier.toViews)
              const fromInvalid = toNum != null && fromNum > toNum
              return (
                <tr key={`tier-${index}`} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={tier.fromViews}
                      onChange={(e) => updateRow(index, 'fromViews', e.target.value)}
                      disabled={index === 0}
                      required
                      className={fromInvalid || rowErrors[index] ? 'border-red-400' : ''}
                    />
                    {index === 0 ? (
                      <p className="mt-1 text-[11px] text-slate-400">Fresh starts at 0</p>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      min={fromNum}
                      step={1}
                      value={tier.toViews === '' || tier.toViews == null ? '' : tier.toViews}
                      onChange={(e) => updateRow(index, 'toViews', e.target.value)}
                      placeholder="∞"
                      className={fromInvalid || rowErrors[index] ? 'border-red-400' : ''}
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      {index === tiers.length - 1
                        ? 'Blank = unlimited'
                        : `Must be ≥ From (${fromNum})`}
                    </p>
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={tier.tokenCost}
                      onChange={(e) => updateRow(index, 'tokenCost', e.target.value)}
                      required
                    />
                  </td>
                  <td className="py-2 pr-3 text-xs font-semibold text-slate-600">
                    {index === 0
                      ? '1st (fresh)'
                      : `${index + 1}${index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} set`}
                    {rowErrors[index] ? (
                      <p className="mt-1 font-medium text-red-600">{rowErrors[index]}</p>
                    ) : null}
                  </td>
                  <td className="py-2">
                    {index > 0 ? (
                      <button
                        type="button"
                        className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeOption(index)}
                        aria-label="Remove option"
                      >
                        <Trash2 className="size-4" strokeWidth={2} />
                      </button>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!valid && errors.length ? (
        <p className="text-sm font-medium text-red-600">{errors[0]}</p>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        className="inline-flex items-center gap-2"
        onClick={addOption}
        disabled={!valid}
      >
        <Plus className="size-4" strokeWidth={2} />
        Add option
      </Button>

      {showMaxUnlocks ? (
        <div className="grid max-w-xl gap-3 sm:grid-cols-2">
          <Input
            label="Max unlocks per lead"
            type="number"
            min={0}
            step={1}
            value={maxUnlocksPerLead}
            onChange={(e) => onMaxUnlocksChange?.(e.target.value)}
            required
          />
          <p className="self-end text-xs text-slate-500 sm:pb-2">
            How many professionals can unlock one lead. Use <strong>0</strong> for unlimited.
          </p>
        </div>
      ) : null}
    </div>
  )
}
