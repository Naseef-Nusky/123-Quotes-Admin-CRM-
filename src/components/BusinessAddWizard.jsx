import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { api } from '../api/client.js'
import PostcodeInput from './PostcodeInput.jsx'
import PhoneInput from './PhoneInput.jsx'
import {
  DEFAULT_COUNTRY_CODE,
  COUNTRY_DIAL_CODES,
  formatIntlPhone,
} from '../data/countryDialCodes.js'
import { Button, Input, Modal, Select } from './ui.jsx'

const emptyForm = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  countryCode: DEFAULT_COUNTRY_CODE,
  website: '',
  password: '',
  confirmPassword: '',
  serviceName: '',
  locationType: 'radius',
  radius: '50',
  postcode: '',
  status: 'ACTIVE',
}

/**
 * Two-step business signup wizard matching the public frontend registration fields.
 */
export default function BusinessAddWizard({
  open,
  onClose,
  onCreated,
  defaultStatus = 'ACTIVE',
  title = 'Add business',
}) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ ...emptyForm, status: defaultStatus })
  const [services, setServices] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep(1)
    setForm({ ...emptyForm, status: defaultStatus })
    setError('')
    setShowPassword(false)
    setShowConfirm(false)
    api
      .getServices()
      .then((d) => setServices(d.services || []))
      .catch(() => setServices([]))
  }, [open, defaultStatus])

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function goNext(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Name, email and phone are required.')
      return
    }
    if (!form.serviceName.trim()) {
      setError('Please select a service type.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setStep(2)
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (form.locationType === 'radius' && !form.postcode.trim()) {
      setError('Postcode is required for radius coverage.')
      return
    }

    setSaving(true)
    try {
      const dial =
        COUNTRY_DIAL_CODES.find((c) => c.code === form.countryCode)?.dial || '44'
      await api.createProfessional({
        email: form.email.trim(),
        password: form.password,
        contactName: form.name.trim(),
        companyName: (form.companyName || form.name).trim(),
        phone: formatIntlPhone(dial, form.phone),
        website: form.website.trim() || undefined,
        serviceName: form.serviceName.trim(),
        postcode: form.locationType === 'nationwide' ? 'UK' : form.postcode.trim(),
        radiusMiles: form.locationType === 'radius' ? Number(form.radius) : null,
        nationwide: form.locationType === 'nationwide',
        status: form.status || defaultStatus,
      })
      onCreated?.()
      onClose?.()
    } catch (err) {
      setError(err.message || 'Failed to create business')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={title} onClose={onClose} wide>
      <div className="mb-5 flex items-center gap-2">
        {[
          { n: 1, label: 'Details' },
          { n: 2, label: 'Location' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 ? <span className="h-px w-6 bg-slate-200" /> : null}
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                step === s.n
                  ? 'bg-gradient-to-b from-[#3baee8] via-[#1e8fd5] to-[#0a3a7a] text-white shadow-sm'
                  : step > s.n
                    ? 'bg-blue/15 text-blue'
                    : 'bg-slate-100 text-slate-500'
              }`}
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                {s.n}
              </span>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {step === 1 ? (
        <form className="space-y-3" onSubmit={goNext}>
          <Input label="Your name" value={form.name} onChange={update('name')} required />
          <div>
            <Input
              label="Company name"
              value={form.companyName}
              onChange={update('companyName')}
            />
            <p className="mt-1 text-xs text-slate-500">
              If you aren&apos;t a business or don&apos;t have this information, you can leave this blank
            </p>
          </div>
          <Input
            label="Email address"
            type="email"
            value={form.email}
            onChange={update('email')}
            required
          />
          <label className="block text-sm font-semibold text-navy">
            Phone number
            <div className="mt-1 font-normal">
              <PhoneInput
                dialCode={form.countryCode}
                onDialCodeChange={(code) => setForm((f) => ({ ...f, countryCode: code }))}
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              />
            </div>
          </label>
          <Input
            label="Website (optional)"
            value={form.website}
            onChange={update('website')}
            placeholder="https://"
          />
          <Select
            label="Service type"
            value={form.serviceName}
            onChange={update('serviceName')}
            required
          >
            <option value="">Select service…</option>
            {services.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select label="Account status" value={form.status} onChange={update('status')}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="INACTIVE">INACTIVE</option>
          </Select>

          <label className="block text-sm font-semibold text-navy">
            Password
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                required
                minLength={6}
                className="w-full rounded-md border border-slate-200 px-3 py-2.5 pr-11 text-sm font-normal outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          <label className="block text-sm font-semibold text-navy">
            Confirm password
            <div className="relative mt-1">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                required
                minLength={6}
                className="w-full rounded-md border border-slate-200 px-3 py-2.5 pr-11 text-sm font-normal outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          {error ? <p className="text-sm text-warn">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Next</Button>
          </div>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <p className="text-sm font-semibold text-navy">
            What location would you like to see leads from?
          </p>

          <label
            className={`flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition ${
              form.locationType === 'radius'
                ? 'border-blue bg-blue/5'
                : 'border-slate-200 bg-slate-50 hover:border-blue/40'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-navy">
              <input
                type="radio"
                name="locationType"
                value="radius"
                checked={form.locationType === 'radius'}
                onChange={update('locationType')}
                className="size-4 accent-blue"
              />
              I want clients within
            </span>
            <div className="flex flex-wrap items-center gap-2 pl-6">
              <select
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={form.radius}
                onChange={update('radius')}
                disabled={form.locationType !== 'radius'}
              >
                {['10', '25', '50', '100'].map((m) => (
                  <option key={m} value={m}>
                    {m} miles
                  </option>
                ))}
              </select>
              <span className="text-sm font-semibold text-navy">from</span>
              <div className="min-w-[180px] flex-1">
                <PostcodeInput
                  value={form.postcode}
                  onChange={(v) => setForm((f) => ({ ...f, postcode: v }))}
                  placeholder="Postcode"
                  disabled={form.locationType !== 'radius'}
                />
              </div>
            </div>
          </label>

          <label
            className={`flex cursor-pointer items-center gap-2 rounded-xl border p-4 transition ${
              form.locationType === 'nationwide'
                ? 'border-blue bg-blue/5'
                : 'border-slate-200 bg-slate-50 hover:border-blue/40'
            }`}
          >
            <input
              type="radio"
              name="locationType"
              value="nationwide"
              checked={form.locationType === 'nationwide'}
              onChange={update('locationType')}
              className="size-4 accent-blue"
            />
            <span className="text-sm font-semibold text-navy">I want clients nationwide</span>
          </label>

          {error ? <p className="text-sm text-warn">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create business'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
