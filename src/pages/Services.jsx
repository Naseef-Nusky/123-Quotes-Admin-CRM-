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
} from '../components/ui.jsx'

const emptyCategory = { name: '', description: '', icon: '', sortOrder: 0, isActive: true }
const emptyService = {
  categoryId: '',
  name: '',
  shortDesc: '',
  description: '',
  tokenCost: 1,
  sortOrder: 0,
  isActive: true,
}

export default function Services() {
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [catModal, setCatModal] = useState(null)
  const [svcModal, setSvcModal] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [catData, svcData] = await Promise.all([api.getCategories(), api.getServicesAll()])
      const fromApi = catData.categories || []
      const fromServices = (svcData.services || [])
        .map((s) => s.category)
        .filter(Boolean)
      const byId = new Map()
      ;[...fromApi, ...fromServices].forEach((c) => {
        if (!c?.id) return
        const existing = byId.get(c.id)
        byId.set(c.id, {
          ...existing,
          ...c,
          services: c.services || existing?.services || [],
        })
      })
      setCategories([...byId.values()].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)))
      setServices(svcData.services || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function saveCategory(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = {
        ...catModal,
        sortOrder: Number(catModal.sortOrder) || 0,
        isActive: catModal.isActive !== false && catModal.isActive !== 'false',
      }
      if (body.id) await api.updateCategory(body.id, body)
      else await api.upsertCategory(body)
      setCatModal(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveService(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = {
        ...svcModal,
        tokenCost: Number(svcModal.tokenCost) || 1,
        sortOrder: Number(svcModal.sortOrder) || 0,
        isActive: svcModal.isActive !== false && svcModal.isActive !== 'false',
      }
      if (body.id) await api.updateService(body.id, body)
      else await api.upsertService(body)
      setSvcModal(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const catColumns = [
    { key: 'name', label: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'slug', label: 'Slug' },
    {
      key: 'services',
      label: 'Services',
      render: (c) => services.filter((s) => s.categoryId === c.id).length,
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (c) => <StatusBadge status={c.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      label: '',
      render: (c) => (
        <Button variant="ghost" onClick={() => setCatModal({ ...c })}>
          Edit
        </Button>
      ),
    },
  ]

  const svcColumns = [
    { key: 'name', label: 'Service', render: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'category', label: 'Category', render: (s) => s.category?.name || '—' },
    { key: 'tokenCost', label: 'Tokens' },
    {
      key: 'counts',
      label: 'Q / Req',
      render: (s) => `${s._count?.questions ?? 0} / ${s._count?.requests ?? 0}`,
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (s) => <StatusBadge status={s.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      label: '',
      render: (s) => (
        <Button
          variant="ghost"
          onClick={() =>
            setSvcModal({
              id: s.id,
              categoryId: s.categoryId,
              name: s.name,
              shortDesc: s.shortDesc || '',
              description: s.description || '',
              tokenCost: s.tokenCost,
              sortOrder: s.sortOrder,
              isActive: s.isActive,
            })
          }
        >
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Services & categories"
        subtitle="Manage marketplace categories and quote services."
        actions={
          <>
            <Button variant="secondary" onClick={() => setCatModal({ ...emptyCategory })}>
              Add category
            </Button>
            <Button onClick={() => setSvcModal({ ...emptyService })}>Add service</Button>
          </>
        }
      />
      <ErrorBanner message={error} />
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Categories</h2>
            <Table columns={catColumns} rows={categories} empty="No categories yet." />
          </div>
          <div>
            <h2 className="mb-3 text-lg font-semibold">Services</h2>
            <Table columns={svcColumns} rows={services} empty="No services yet." />
          </div>
        </div>
      )}

      <Modal
        open={!!catModal}
        title={catModal?.id ? 'Edit category' : 'New category'}
        onClose={() => setCatModal(null)}
      >
        {catModal && (
          <form className="space-y-3" onSubmit={saveCategory}>
            <Input
              label="Name"
              value={catModal.name}
              onChange={(e) => setCatModal({ ...catModal, name: e.target.value })}
              required
            />
            <Textarea
              label="Description"
              rows={3}
              value={catModal.description || ''}
              onChange={(e) => setCatModal({ ...catModal, description: e.target.value })}
            />
            <Input
              label="Icon"
              value={catModal.icon || ''}
              onChange={(e) => setCatModal({ ...catModal, icon: e.target.value })}
            />
            <Input
              label="Sort order"
              type="number"
              value={catModal.sortOrder}
              onChange={(e) => setCatModal({ ...catModal, sortOrder: e.target.value })}
            />
            <Select
              label="Active"
              value={String(catModal.isActive !== false)}
              onChange={(e) => setCatModal({ ...catModal, isActive: e.target.value === 'true' })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setCatModal(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!svcModal}
        title={svcModal?.id ? 'Edit service' : 'New service'}
        onClose={() => setSvcModal(null)}
        wide
      >
        {svcModal && (
          <form className="space-y-3" onSubmit={saveService}>
            <Select
              label="Category"
              value={svcModal.categoryId}
              onChange={(e) => setSvcModal({ ...svcModal, categoryId: e.target.value })}
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              label="Name"
              value={svcModal.name}
              onChange={(e) => setSvcModal({ ...svcModal, name: e.target.value })}
              required
            />
            <Input
              label="Short description"
              value={svcModal.shortDesc || ''}
              onChange={(e) => setSvcModal({ ...svcModal, shortDesc: e.target.value })}
            />
            <Textarea
              label="Description"
              rows={4}
              value={svcModal.description || ''}
              onChange={(e) => setSvcModal({ ...svcModal, description: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Token cost"
                type="number"
                min="1"
                value={svcModal.tokenCost}
                onChange={(e) => setSvcModal({ ...svcModal, tokenCost: e.target.value })}
              />
              <Input
                label="Sort order"
                type="number"
                value={svcModal.sortOrder}
                onChange={(e) => setSvcModal({ ...svcModal, sortOrder: e.target.value })}
              />
            </div>
            <Select
              label="Active"
              value={String(svcModal.isActive !== false)}
              onChange={(e) => setSvcModal({ ...svcModal, isActive: e.target.value === 'true' })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setSvcModal(null)}>
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
