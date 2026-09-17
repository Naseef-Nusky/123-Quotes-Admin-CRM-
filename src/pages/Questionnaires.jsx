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

const QUESTION_TYPES = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN', 'TEXT', 'TEXTAREA']

const emptyQuestion = {
  serviceId: '',
  label: '',
  helpText: '',
  type: 'TEXT',
  isRequired: true,
  sortOrder: 0,
  optionsText: '',
}

export default function Questionnaires() {
  const [services, setServices] = useState([])
  const [serviceId, setServiceId] = useState('')
  const [questions, setQuestions] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [branchModal, setBranchModal] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadServices() {
    const data = await api.getServicesAll()
    setServices(data.services || [])
  }

  async function loadQuestions(sid = serviceId) {
    setLoading(true)
    setError('')
    try {
      const data = await api.getQuestions(sid || undefined)
      setQuestions(data.questions || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
      .then(() => loadQuestions())
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadQuestions(serviceId)
  }, [serviceId])

  function parseOptions(text) {
    return String(text || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((label, idx) => ({ label, value: label, sortOrder: idx }))
  }

  async function saveQuestion(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const options = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN'].includes(modal.type)
        ? parseOptions(modal.optionsText)
        : []
      const body = {
        serviceId: modal.serviceId,
        label: modal.label,
        helpText: modal.helpText,
        type: modal.type,
        isRequired: modal.isRequired !== false && modal.isRequired !== 'false',
        sortOrder: Number(modal.sortOrder) || 0,
        options,
        isActive: modal.isActive !== false && modal.isActive !== 'false',
      }
      if (modal.id) await api.updateQuestion(modal.id, body)
      else await api.createQuestion(body)
      setModal(null)
      await loadQuestions()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeQuestion(id) {
    if (!confirm('Delete this question?')) return
    setError('')
    try {
      await api.deleteQuestion(id)
      await loadQuestions()
    } catch (err) {
      setError(err.message)
    }
  }

  async function saveBranch(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.createBranch({
        sourceQuestionId: branchModal.sourceQuestionId,
        targetQuestionId: branchModal.targetQuestionId,
        optionId: branchModal.optionId || null,
        operator: branchModal.operator || 'EQUALS',
        value: branchModal.value || null,
      })
      setBranchModal(null)
      await loadQuestions()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: 'label',
      label: 'Question',
      render: (q) => (
        <div>
          <p className="font-medium">{q.label}</p>
          <p className="text-xs text-slate-500">{q.service?.name || '—'}</p>
        </div>
      ),
    },
    { key: 'type', label: 'Type', render: (q) => q.type.replaceAll('_', ' ') },
    {
      key: 'required',
      label: 'Required',
      render: (q) => (q.isRequired ? 'Yes' : 'No'),
    },
    {
      key: 'options',
      label: 'Options',
      render: (q) => q.options?.length || 0,
    },
    {
      key: 'active',
      label: 'Active',
      render: (q) => <StatusBadge status={q.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      label: '',
      render: (q) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            onClick={() =>
              setModal({
                id: q.id,
                serviceId: q.serviceId,
                label: q.label,
                helpText: q.helpText || '',
                type: q.type,
                isRequired: q.isRequired,
                sortOrder: q.sortOrder,
                isActive: q.isActive,
                optionsText: (q.options || []).map((o) => o.label).join('\n'),
              })
            }
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              setBranchModal({
                sourceQuestionId: q.id,
                targetQuestionId: '',
                optionId: '',
                operator: 'EQUALS',
                value: '',
              })
            }
          >
            Branch
          </Button>
          <Button variant="ghost" onClick={() => removeQuestion(q.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const sourceQuestion = questions.find((q) => q.id === branchModal?.sourceQuestionId)

  return (
    <div>
      <PageHeader
        title="Questionnaires"
        subtitle="Service questions, options, and branching."
        actions={
          <Button
            onClick={() =>
              setModal({ ...emptyQuestion, serviceId: serviceId || services[0]?.id || '' })
            }
          >
            Add question
          </Button>
        }
      />
      <div className="mb-4 max-w-sm">
        <Select
          label="Filter by service"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
        >
          <option value="">All services</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>
      <ErrorBanner message={error} />
      {loading ? (
        <Loading />
      ) : (
        <Table columns={columns} rows={questions} empty="No questions found." />
      )}

      <Modal
        open={!!modal}
        title={modal?.id ? 'Edit question' : 'New question'}
        onClose={() => setModal(null)}
        wide
      >
        {modal && (
          <form className="space-y-3" onSubmit={saveQuestion}>
            <Select
              label="Service"
              value={modal.serviceId}
              onChange={(e) => setModal({ ...modal, serviceId: e.target.value })}
              required
              disabled={!!modal.id}
            >
              <option value="">Select service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Input
              label="Label"
              value={modal.label}
              onChange={(e) => setModal({ ...modal, label: e.target.value })}
              required
            />
            <Textarea
              label="Help text"
              rows={2}
              value={modal.helpText}
              onChange={(e) => setModal({ ...modal, helpText: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Type"
                value={modal.type}
                onChange={(e) => setModal({ ...modal, type: e.target.value })}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll('_', ' ')}
                  </option>
                ))}
              </Select>
              <Input
                label="Sort order"
                type="number"
                value={modal.sortOrder}
                onChange={(e) => setModal({ ...modal, sortOrder: e.target.value })}
              />
            </div>
            {['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN'].includes(modal.type) && (
              <Textarea
                label="Options (one per line)"
                rows={5}
                value={modal.optionsText}
                onChange={(e) => setModal({ ...modal, optionsText: e.target.value })}
                required
              />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Required"
                value={String(modal.isRequired !== false)}
                onChange={(e) => setModal({ ...modal, isRequired: e.target.value === 'true' })}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
              {modal.id && (
                <Select
                  label="Active"
                  value={String(modal.isActive !== false)}
                  onChange={(e) => setModal({ ...modal, isActive: e.target.value === 'true' })}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              )}
            </div>
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

      <Modal open={!!branchModal} title="Add branch rule" onClose={() => setBranchModal(null)}>
        {branchModal && (
          <form className="space-y-3" onSubmit={saveBranch}>
            <Select
              label="Target question"
              value={branchModal.targetQuestionId}
              onChange={(e) => setBranchModal({ ...branchModal, targetQuestionId: e.target.value })}
              required
            >
              <option value="">Select target</option>
              {questions
                .filter((q) => q.id !== branchModal.sourceQuestionId)
                .map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
            </Select>
            {(sourceQuestion?.options || []).length > 0 && (
              <Select
                label="When option"
                value={branchModal.optionId}
                onChange={(e) => setBranchModal({ ...branchModal, optionId: e.target.value })}
              >
                <option value="">Any / value match</option>
                {sourceQuestion.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            )}
            <Input
              label="Operator"
              value={branchModal.operator}
              onChange={(e) => setBranchModal({ ...branchModal, operator: e.target.value })}
            />
            <Input
              label="Value"
              value={branchModal.value}
              onChange={(e) => setBranchModal({ ...branchModal, value: e.target.value })}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setBranchModal(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Create branch'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
