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

const emptyTemplate = {
  key: '',
  subject: '',
  bodyHtml: '',
  bodyText: '',
  isActive: true,
}

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getTemplates()
      setTemplates(data.templates || [])
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
      await api.upsertTemplate({
        ...modal,
        isActive: modal.isActive !== false && modal.isActive !== 'false',
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
    { key: 'key', label: 'Key', render: (t) => <code className="text-xs">{t.key}</code> },
    { key: 'subject', label: 'Subject' },
    {
      key: 'active',
      label: 'Active',
      render: (t) => <StatusBadge status={t.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      label: '',
      render: (t) => (
        <Button variant="ghost" onClick={() => setModal({ ...t })}>
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Email templates"
        subtitle="Transactional email content."
        actions={<Button onClick={() => setModal({ ...emptyTemplate })}>Add template</Button>}
      />
      <ErrorBanner message={error} />
      {loading ? (
        <Loading />
      ) : (
        <Table columns={columns} rows={templates} empty="No templates yet." />
      )}

      <Modal
        open={!!modal}
        title={modal?.id ? 'Edit template' : 'New template'}
        onClose={() => setModal(null)}
        wide
      >
        {modal && (
          <form className="space-y-3" onSubmit={save}>
            <Input
              label="Key"
              value={modal.key}
              onChange={(e) => setModal({ ...modal, key: e.target.value })}
              required
              disabled={!!modal.id}
            />
            <Input
              label="Subject"
              value={modal.subject}
              onChange={(e) => setModal({ ...modal, subject: e.target.value })}
              required
            />
            <Textarea
              label="HTML body"
              rows={8}
              value={modal.bodyHtml || ''}
              onChange={(e) => setModal({ ...modal, bodyHtml: e.target.value })}
              required
            />
            <Textarea
              label="Text body"
              rows={4}
              value={modal.bodyText || ''}
              onChange={(e) => setModal({ ...modal, bodyText: e.target.value })}
            />
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
