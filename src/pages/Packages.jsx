import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import {
  Button,
  ErrorBanner,
  Input,
  Loading,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Table,
  Textarea,
  formatMoney,
} from '../components/ui.jsx'

const emptyPackage = {
  name: '',
  description: '',
  tokens: 10,
  priceCents: 999,
  currency: 'GBP',
  isActive: true,
  sortOrder: 0,
}

export default function Packages() {
  const [packages, setPackages] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getPackages()
      setPackages(data.packages || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = {
        ...modal,
        tokens: Number(modal.tokens),
        priceCents: Number(modal.priceCents),
        sortOrder: Number(modal.sortOrder) || 0,
        isActive: modal.isActive !== false && modal.isActive !== 'false',
      }
      if (body.id) await api.updatePackage(body.id, body)
      else await api.createPackage(body)
      setModal(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Package', render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'tokens', label: 'Tokens' },
    {
      key: 'price',
      label: 'Price',
      render: (p) => formatMoney(p.priceCents, p.currency || 'GBP'),
    },
    {
      key: 'active',
      label: 'Active',
      render: (p) => <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    { key: 'sortOrder', label: 'Order' },
    {
      key: 'actions',
      label: '',
      render: (p) => (
        <Button variant="ghost" onClick={() => setModal({ ...p })}>
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Token packages"
        subtitle="Packages professionals can purchase."
        actions={<Button onClick={() => setModal({ ...emptyPackage })}>Add package</Button>}
      />
      <ErrorBanner message={error} />
      {loading ? (
        <Loading />
      ) : (
        <Table columns={columns} rows={packages} empty="No packages yet." />
      )}

      <Modal
        open={!!modal}
        title={modal?.id ? 'Edit package' : 'New package'}
        onClose={() => setModal(null)}
      >
        {modal && (
          <form className="space-y-3" onSubmit={save}>
            <Input
              label="Name"
              value={modal.name}
              onChange={(e) => setModal({ ...modal, name: e.target.value })}
              required
            />
            <Textarea
              label="Description"
              rows={3}
              value={modal.description || ''}
              onChange={(e) => setModal({ ...modal, description: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Tokens"
                type="number"
                min="1"
                value={modal.tokens}
                onChange={(e) => setModal({ ...modal, tokens: e.target.value })}
                required
              />
              <Input
                label="Price (cents)"
                type="number"
                min="0"
                value={modal.priceCents}
                onChange={(e) => setModal({ ...modal, priceCents: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Currency"
                value={modal.currency || 'GBP'}
                onChange={(e) => setModal({ ...modal, currency: e.target.value })}
              />
              <Input
                label="Sort order"
                type="number"
                value={modal.sortOrder}
                onChange={(e) => setModal({ ...modal, sortOrder: e.target.value })}
              />
            </div>
            <Select
              label="Active"
              value={String(modal.isActive !== false)}
              onChange={(e) => setModal({ ...modal, isActive: e.target.value === 'true' })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
