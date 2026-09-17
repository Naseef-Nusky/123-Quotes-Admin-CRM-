import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import {
  Button,
  Card,
  ErrorBanner,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui.jsx'

export default function AdjustTokens() {
  const [professionals, setProfessionals] = useState([])
  const [professionalId, setProfessionalId] = useState('')
  const [amount, setAmount] = useState('10')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .getUsers({ role: 'PROFESSIONAL' })
      .then((data) => {
        const list = (data.users || [])
          .filter((u) => u.professional)
          .map((u) => ({
            id: u.professional.id,
            label: `${u.professional.companyName || u.email} (${u.professional.tokenBalance ?? 0} tokens)`,
            email: u.email,
          }))
        setProfessionals(list)
        if (list[0]) setProfessionalId(list[0].id)
      })
      .catch((err) => setError(err.message))
  }, [])

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const data = await api.adjustTokens({
        professionalId,
        amount: Number(amount),
        reason: reason || 'admin-adjust',
      })
      setMessage(
        `Updated balance for ${data.professional?.companyName || 'professional'}: ${
          data.professional?.tokenBalance ?? '—'
        } tokens.`,
      )
      setReason('')
      const refreshed = await api.getUsers({ role: 'PROFESSIONAL' })
      const list = (refreshed.users || [])
        .filter((u) => u.professional)
        .map((u) => ({
          id: u.professional.id,
          label: `${u.professional.companyName || u.email} (${u.professional.tokenBalance ?? 0} tokens)`,
          email: u.email,
        }))
      setProfessionals(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Adjust pro tokens"
        subtitle="Manually credit or debit a professional’s token balance."
      />
      <ErrorBanner message={error} />
      {message && (
        <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-ok">
          {message}
        </p>
      )}

      <Card className="max-w-lg p-5">
        <form className="space-y-3" onSubmit={submit}>
          <Select
            label="Professional"
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            required
          >
            <option value="">Select professional</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
          <Input
            label="Amount (+ credit / − debit)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Textarea
            label="Reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional note"
          />
          <Button type="submit" disabled={saving || !professionalId}>
            {saving ? 'Updating…' : 'Adjust tokens'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
