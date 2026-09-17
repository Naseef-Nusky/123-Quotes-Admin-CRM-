import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import {
  Button,
  Card,
  ErrorBanner,
  Input,
  Loading,
  PageHeader,
  Textarea,
} from '../components/ui.jsx'

export default function Settings() {
  const [settings, setSettings] = useState([])
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getSettings()
      setSettings(data.settings || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function editSetting(setting) {
    setKey(setting.key)
    setValue(
      typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value, null, 2),
    )
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      let parsed = value
      try {
        parsed = JSON.parse(value)
      } catch {
        parsed = value
      }
      await api.upsertSetting({ key, value: parsed })
      setMessage('Setting saved.')
      setKey('')
      setValue('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Key/value platform configuration." />
      <ErrorBanner message={error} />
      {message && (
        <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-ok">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">{key ? `Edit: ${key}` : 'Upsert setting'}</h2>
          <form className="space-y-3" onSubmit={save}>
            <Input
              label="Key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
            <Textarea
              label="Value (JSON or plain text)"
              rows={8}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save setting'}
            </Button>
          </form>
        </Card>

        <div>
          <h2 className="mb-3 font-semibold">Current settings</h2>
          {loading ? (
            <Loading />
          ) : settings.length === 0 ? (
            <Card className="px-6 py-10 text-center text-sm text-slate-500">No settings yet.</Card>
          ) : (
            <div className="space-y-2">
              {settings.map((s) => (
                <Card key={s.key} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium">{s.key}</p>
                    <pre className="mt-1 overflow-auto text-xs text-slate-500">
                      {typeof s.value === 'string' ? s.value : JSON.stringify(s.value, null, 2)}
                    </pre>
                  </div>
                  <Button variant="ghost" onClick={() => editSetting(s)}>
                    Edit
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
