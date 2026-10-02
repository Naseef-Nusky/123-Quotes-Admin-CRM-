import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import {
  UnlockTokenTiersForm,
  defaultUnlockTiers,
  normalizeUnlockTiersForUi,
  serializeUnlockTiers,
} from '../components/UnlockTokenTiersForm.jsx'
import { Button, Card, ErrorBanner, Loading, PageHeader } from '../components/ui.jsx'

export default function TokenAdjust() {
  const [error, setError] = useState('')
  const [maxUnlocksPerLead, setMaxUnlocksPerLead] = useState(0)
  const [tiers, setTiers] = useState(defaultUnlockTiers)
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .getSettings()
      .then((settingsRes) => {
        if (cancelled) return
        const settings = settingsRes.settings || []
        const max = settings.find((s) => s.key === 'max_unlocks_per_lead')
        const tierSetting = settings.find((s) => s.key === 'unlock_token_tiers')
        const maxN = Number(max?.value)
        setMaxUnlocksPerLead(Number.isFinite(maxN) && maxN >= 0 ? maxN : 0)
        setTiers(normalizeUnlockTiersForUi(tierSetting?.value))
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load token settings')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function savePricing(e) {
    e.preventDefault()
    const max = Math.max(0, Math.floor(Number(maxUnlocksPerLead) || 0))
    setBusy(true)
    setError('')
    setFlash('')
    try {
      const cleaned = serializeUnlockTiers(tiers)
      const freshCost = cleaned[0]?.tokenCost || 1
      await Promise.all([
        api.upsertSetting({ key: 'unlock_token_tiers', value: cleaned }),
        api.upsertSetting({ key: 'default_unlock_token_cost', value: freshCost }),
        api.upsertSetting({ key: 'max_unlocks_per_lead', value: max }),
      ])
      setTiers(normalizeUnlockTiersForUi(cleaned))
      setMaxUnlocksPerLead(max)
      setFlash('Token adjust settings saved.')
      setTimeout(() => setFlash(''), 2200)
    } catch (err) {
      setError(err.message || 'Failed to save token settings')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Default Token Adjust"
        subtitle="Common unlock token pricing for all leads that do not have individual tokens set."
      />
      <ErrorBanner message={error} />

      <Card className="p-5">
        {loading ? (
          <Loading className="py-8" />
        ) : (
          <form className="space-y-4" onSubmit={savePricing}>
            <UnlockTokenTiersForm
              tiers={tiers}
              onChange={setTiers}
              showMaxUnlocks
              maxUnlocksPerLead={maxUnlocksPerLead}
              onMaxUnlocksChange={setMaxUnlocksPerLead}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save token options'}
              </Button>
              {flash ? <p className="text-sm font-semibold text-ok">{flash}</p> : null}
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
