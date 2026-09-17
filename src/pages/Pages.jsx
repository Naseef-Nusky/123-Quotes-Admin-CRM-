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

const emptyPage = {
  slug: '',
  title: '',
  body: '',
  isPublished: true,
}

export default function Pages() {
  const [pages, setPages] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getPages()
      setPages(data.pages || [])
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
      await api.upsertPage({
        ...modal,
        isPublished: modal.isPublished !== false && modal.isPublished !== 'false',
      })
      setModal(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'slug', label: 'Slug', render: (p) => <code className="text-xs">{p.slug}</code> },
    { key: 'title', label: 'Title', render: (p) => <span className="font-medium">{p.title}</span> },
    {
      key: 'published',
      label: 'Published',
      render: (p) => <StatusBadge status={p.isPublished ? 'ACTIVE' : 'INACTIVE'} />,
    },
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
        title="Pages"
        subtitle="CMS page content (about, terms, etc.)."
        actions={<Button onClick={() => setModal({ ...emptyPage })}>Add page</Button>}
      />
      <ErrorBanner message={error} />
      {loading ? <Loading /> : <Table columns={columns} rows={pages} empty="No pages yet." />}

      <Modal
        open={!!modal}
        title={modal?.slug && pages.some((p) => p.slug === modal.slug) ? 'Edit page' : 'New page'}
        onClose={() => setModal(null)}
        wide
      >
        {modal && (
          <form className="space-y-3" onSubmit={save}>
            <Input
              label="Slug"
              value={modal.slug}
              onChange={(e) => setModal({ ...modal, slug: e.target.value })}
              required
            />
            <Input
              label="Title"
              value={modal.title}
              onChange={(e) => setModal({ ...modal, title: e.target.value })}
              required
            />
            <Textarea
              label="Body"
              rows={10}
              value={modal.body || ''}
              onChange={(e) => setModal({ ...modal, body: e.target.value })}
              required
            />
            <Select
              label="Published"
              value={String(modal.isPublished !== false)}
              onChange={(e) => setModal({ ...modal, isPublished: e.target.value === 'true' })}
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
