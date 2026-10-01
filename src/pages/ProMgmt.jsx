import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderTree, HelpCircle, Plus, Search } from 'lucide-react'
import { api } from '../api/client.js'
import {
  Button,
  Card,
  ErrorBanner,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui.jsx'

const CHILD_TYPES = [
  { value: 'Single select radio', label: 'Single select (radio)' },
  { value: 'Single select checkbox', label: 'Single select (checkbox)' },
  { value: 'Multiple select checkbox', label: 'Multiple select (checkbox)' },
  { value: 'Multiple select radio', label: 'Multiple select (radio)' },
  { value: 'Dropdown', label: 'Dropdown' },
  { value: 'Text', label: 'Text' },
]

function uiTypeToApi(type) {
  if (type === 'Multiple select checkbox' || type === 'Multiple select' || type === 'Checkbox') {
    return 'MULTIPLE_CHOICE'
  }
  if (type === 'Multiple select radio') return 'MULTIPLE_RADIO'
  if (type === 'Single select checkbox') return 'SINGLE_CHECKBOX'
  if (type === 'Dropdown') return 'DROPDOWN'
  if (type === 'Text') return 'TEXT'
  // Single select radio / Radio Button / default
  return 'SINGLE_CHOICE'
}

function apiTypeToUi(type) {
  if (type === 'MULTIPLE_CHOICE') return 'Multiple select checkbox'
  if (type === 'MULTIPLE_RADIO') return 'Multiple select radio'
  if (type === 'SINGLE_CHECKBOX') return 'Single select checkbox'
  if (type === 'DROPDOWN') return 'Dropdown'
  if (type === 'TEXT' || type === 'TEXTAREA') return 'Text'
  return 'Single select radio'
}

function typeHint(uiType) {
  if (uiType === 'Multiple select checkbox' || uiType === 'Multiple select' || uiType === 'Checkbox') {
    return 'Customers can tick one or more checkbox options.'
  }
  if (uiType === 'Multiple select radio') {
    return 'Customers can pick one or more options shown as radio buttons.'
  }
  if (uiType === 'Single select checkbox') {
    return 'Customers pick only one option, shown as checkboxes.'
  }
  if (uiType === 'Single select radio' || uiType === 'Radio Button') {
    return 'Customers pick only one option, shown as radio buttons.'
  }
  if (uiType === 'Dropdown') {
    return 'Customers pick one option from a dropdown list.'
  }
  return 'Customers type a free-text answer.'
}

function isMultiUiType(uiType) {
  return (
    uiType === 'Multiple select checkbox' ||
    uiType === 'Multiple select radio' ||
    uiType === 'Multiple select' ||
    uiType === 'Checkbox'
  )
}

function needsOptions(uiType) {
  return uiType !== 'Text'
}

function uniqueOptionValue(label, index, used) {
  const base = String(label || '').trim() || `option-${index + 1}`
  let value = base
  let n = 2
  while (used.has(value)) {
    value = `${base} (${n})`
    n += 1
  }
  used.add(value)
  return value
}

function mapServices(list) {
  return (list || []).map((s) => ({
    id: s.id,
    categoryId: s.categoryId || s.category?.id,
    name: s.name,
    description: s.shortDesc || s.description || '',
    tokenCost: s.tokenCost ?? 1,
    questionCount: s._count?.questions ?? (s.questions || []).length,
    questions: null, // loaded on demand
  }))
}

function mapQuestions(list) {
  return (list || [])
    .filter((q) => q.isActive !== false)
    .map((q) => ({
      id: q.id,
      text: q.label || q.text || 'Question',
      type: apiTypeToUi(q.type),
      answers: (q.options || []).map((o) => ({
        label: o.label || o.value || '',
        nextQuestion: 'End',
      })),
    }))
}

function emptyAnswer() {
  return { label: '', nextQuestion: 'End' }
}

export default function ProMgmt() {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [flash, setFlash] = useState('')
  const [error, setError] = useState('')
  const [catModal, setCatModal] = useState(null)
  const [qModal, setQModal] = useState(null)

  const flashMsg = useCallback((msg) => {
    setFlash(msg)
    setError('')
    setTimeout(() => setFlash(''), 2200)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.manageServices()
      let cats = data.categories || []
      if (!cats.length) {
        const created = await api.createCategory({ name: 'General Services', isActive: true })
        cats = [created.category]
      }
      const tree = mapServices(data.services || [])
      setCategories(cats.filter((c) => c.isActive !== false))
      setServices(tree)
      setSelectedId((prev) => {
        if (prev && tree.some((s) => s.id === prev)) return prev
        return tree[0]?.id || null
      })
    } catch (err) {
      setError(err.message || 'Failed to load services')
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadQuestions = useCallback(async (serviceId) => {
    if (!serviceId) return
    setQuestionsLoading(true)
    try {
      const data = await api.getQuestions(serviceId)
      const mapped = mapQuestions(data.questions || [])
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? { ...s, questions: mapped, questionCount: mapped.length }
            : s,
        ),
      )
    } catch (err) {
      setError(err.message || 'Failed to load questions')
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, questions: [] } : s)),
      )
    } finally {
      setQuestionsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!selectedId) return
    const current = services.find((s) => s.id === selectedId)
    if (current && current.questions == null) {
      loadQuestions(selectedId)
    }
  }, [selectedId, services, loadQuestions])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return services
    return services.filter((s) => s.name.toLowerCase().includes(term))
  }, [services, q])

  const selected = services.find((s) => s.id === selectedId) || filtered[0] || null

  function openAddCategory() {
    setCatModal({
      mode: 'add',
      name: '',
      categoryId: categories[0]?.id || '',
      description: '',
    })
    setError('')
  }

  function openEditCategory(service) {
    setCatModal({
      mode: 'edit',
      id: service.id,
      name: service.name,
      categoryId: service.categoryId || categories[0]?.id || '',
      description: service.description || '',
    })
    setError('')
  }

  async function saveCategory(e) {
    e.preventDefault()
    const name = catModal.name.trim()
    if (!name) {
      setError('Service name is required.')
      return
    }
    const categoryId = catModal.categoryId || categories[0]?.id
    if (!categoryId) {
      setError('Create a parent category first.')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (catModal.mode === 'add') {
        const data = await api.createService({
          categoryId,
          name,
          shortDesc: catModal.description || '',
          description: catModal.description || '',
          tokenCost: 1,
          isActive: true,
        })
        setCatModal(null)
        flashMsg('Service added.')
        await load()
        setSelectedId(data.service?.id)
      } else {
        await api.updateService(catModal.id, {
          categoryId,
          name,
          shortDesc: catModal.description || '',
          description: catModal.description || '',
        })
        setCatModal(null)
        flashMsg('Service updated.')
        await load()
      }
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(service) {
    if (!window.confirm(`Delete “${service.name}” and deactivate its questions?`)) return
    setSaving(true)
    try {
      await api.deleteService(service.id)
      flashMsg('Service deleted.')
      await load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  function openAddQuestion(service) {
    setQModal({
      mode: 'add',
      serviceId: service.id,
      text: '',
      childType: 'Single select radio',
      answers: [emptyAnswer(), emptyAnswer()],
    })
    setError('')
  }

  function openEditQuestion(service, question) {
    let childType = question.type || 'Single select radio'
    if (childType === 'Checkbox' || childType === 'Multiple select') childType = 'Multiple select checkbox'
    if (childType === 'Radio Button') childType = 'Single select radio'
    setQModal({
      mode: 'edit',
      serviceId: service.id,
      questionId: question.id,
      text: question.text || '',
      childType,
      answers: question.answers?.length
        ? question.answers.map((a) => ({ ...a }))
        : [emptyAnswer()],
    })
    setError('')
  }

  async function saveQuestion(e) {
    e.preventDefault()
    const text = qModal.text.trim()
    if (!text) {
      setError('Question text is required.')
      return
    }

    const usedValues = new Set()
    const answers = (qModal.answers || [])
      .map((a, idx) => {
        const label = String(a.label || '').trim()
        if (!label) return null
        return {
          label,
          value: uniqueOptionValue(label, idx, usedValues),
        }
      })
      .filter(Boolean)

    const type = uiTypeToApi(qModal.childType)
    if (needsOptions(qModal.childType) && type !== 'TEXT' && !answers.length) {
      setError('Add at least one answer option for this question type.')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (qModal.mode === 'add') {
        await api.createQuestion({
          serviceId: qModal.serviceId,
          label: text,
          type,
          isRequired: true,
          options: type === 'TEXT' ? [] : answers,
        })
        flashMsg('Question added.')
      } else {
        await api.updateQuestion(qModal.questionId, {
          label: text,
          type,
          options: type === 'TEXT' ? [] : answers,
        })
        flashMsg('Question updated.')
      }
      setQModal(null)
      await loadQuestions(qModal.serviceId)
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteQuestion(question) {
    if (!window.confirm(`Delete question “${question.text}”?`)) return
    setSaving(true)
    try {
      await api.deleteQuestion(question.id)
      flashMsg('Question deleted.')
      if (selectedId) await loadQuestions(selectedId)
    } catch (err) {
      setError(err.message || 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  function updateAnswerRow(index, key, value) {
    setQModal((m) => {
      const answers = [...(m.answers || [])]
      answers[index] = { ...answers[index], [key]: value }
      return { ...m, answers }
    })
  }

  return (
    <div>
      <PageHeader
        title="Pro.Mgmt"
        subtitle="Full control: create, edit, and delete services and questionnaire questions."
        actions={
          <Button onClick={openAddCategory} disabled={saving || loading}>
            <Plus className="mr-1.5 size-4" />
            Add service
          </Button>
        }
      />

      {flash ? <p className="mb-4 text-sm font-semibold text-ok">{flash}</p> : null}
      <ErrorBanner message={error} />
      {loading ? <p className="mb-4 text-sm text-slate-500">Loading services…</p> : null}

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            placeholder="Search services or questions…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            Services ({filtered.length})
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {filtered.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedId(service.id)}
                className={`flex w-full items-start gap-2 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  selected?.id === service.id ? 'bg-blue/5' : ''
                }`}
              >
                <FolderTree className="mt-0.5 size-4 shrink-0 text-blue" />
                <span>
                  <span className="block text-sm font-semibold text-navy">{service.name}</span>
                  <span className="text-xs text-slate-500">
                    {service.questionCount ?? (service.questions || []).length} question(s)
                  </span>
                </span>
              </button>
            ))}
            {!filtered.length && !loading ? (
              <p className="p-4 text-sm text-slate-500">No services yet. Add one to get started.</p>
            ) : null}
          </div>
        </aside>

        <Card className="!p-0 overflow-hidden">
          {selected ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-xl font-bold text-navy">{selected.name}</h2>
                  {selected.description ? (
                    <p className="mt-1 text-sm text-slate-500">{selected.description}</p>
                  ) : null}
                  <p className="mt-2 text-sm font-semibold text-blue">
                    Unlock cost: {selected.tokenCost ?? 1} token
                    {(selected.tokenCost ?? 1) === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => openEditCategory(selected)}>
                    Edit
                  </Button>
                  <Link
                    to="/token-adjust"
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy hover:bg-slate-50"
                  >
                    Tokens
                  </Link>
                  <Button variant="danger" onClick={() => deleteCategory(selected)}>
                    Delete
                  </Button>
                  <Button onClick={() => openAddQuestion(selected)}>
                    <Plus className="mr-1.5 size-4" />
                    Add question
                  </Button>
                </div>
              </div>

              <div className="space-y-3 p-5">
                {questionsLoading && selected.questions == null ? (
                  <p className="text-sm text-slate-500">Loading questions…</p>
                ) : null}
                {(selected.questions || []).map((question) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-2">
                        <HelpCircle className="mt-0.5 size-4 shrink-0 text-blue" />
                        <div>
                          <p className="font-semibold text-navy">{question.text}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Type:{' '}
                            <span
                              className={
                                isMultiUiType(question.type)
                                  ? 'font-semibold text-blue'
                                  : 'font-medium text-navy'
                              }
                            >
                              {question.type}
                            </span>
                            {question.answers?.length
                              ? ` · ${question.answers.length} option(s)`
                              : ''}
                          </p>
                          {isMultiUiType(question.type) ? (
                            <p className="mt-1 text-xs text-blue">Allows multiple answers</p>
                          ) : null}
                          {question.answers?.length ? (
                            <ul className="mt-2 space-y-1 text-sm text-slate-600">
                              {question.answers.map((a) => (
                                <li key={`${question.id}-${a.label}`}>• {a.label}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => openEditQuestion(selected, question)}
                        >
                          Edit
                        </Button>
                        <Button variant="danger" onClick={() => deleteQuestion(question)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {!questionsLoading && selected.questions && !selected.questions.length ? (
                  <p className="text-sm text-slate-500">No questions yet for this service.</p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="p-8 text-sm text-slate-500">Select a service to manage its questions.</p>
          )}
        </Card>
      </div>

      <Modal
        open={!!catModal}
        title={catModal?.mode === 'edit' ? 'Edit service' : 'Add service'}
        onClose={() => setCatModal(null)}
      >
        {catModal ? (
          <form className="space-y-3" onSubmit={saveCategory}>
            <Input
              label="Service name"
              value={catModal.name}
              onChange={(e) => setCatModal((m) => ({ ...m, name: e.target.value }))}
              required
            />
            <Select
              label="Parent category"
              value={catModal.categoryId}
              onChange={(e) => setCatModal((m) => ({ ...m, categoryId: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Textarea
              label="Short description"
              value={catModal.description}
              onChange={(e) => setCatModal((m) => ({ ...m, description: e.target.value }))}
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setCatModal(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : catModal.mode === 'edit' ? 'Save changes' : 'Create service'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={!!qModal}
        title={qModal?.mode === 'edit' ? 'Edit question' : 'Add question'}
        onClose={() => setQModal(null)}
      >
        {qModal ? (
          <form className="space-y-3" onSubmit={saveQuestion}>
            <Textarea
              label="Question"
              value={qModal.text}
              onChange={(e) => setQModal((m) => ({ ...m, text: e.target.value }))}
              required
              rows={3}
            />
            <Select
              label="Answer type"
              value={
                qModal.childType === 'Checkbox' || qModal.childType === 'Multiple select'
                  ? 'Multiple select checkbox'
                  : qModal.childType === 'Radio Button'
                    ? 'Single select radio'
                    : qModal.childType
              }
              onChange={(e) => setQModal((m) => ({ ...m, childType: e.target.value }))}
            >
              {CHILD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <p className="-mt-1 text-xs text-slate-500">{typeHint(qModal.childType)}</p>

            {needsOptions(qModal.childType) ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-navy">
                    Answer options
                    {isMultiUiType(qModal.childType) ? ' (multiple allowed)' : ' (pick one)'}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setQModal((m) => ({ ...m, answers: [...(m.answers || []), emptyAnswer()] }))
                    }
                  >
                    Add option
                  </Button>
                </div>
                {(qModal.answers || []).map((row, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={row.label}
                      onChange={(e) => updateAnswerRow(idx, 'label', e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                    />
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() =>
                        setQModal((m) => ({
                          ...m,
                          answers: (m.answers || []).filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setQModal(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : qModal.mode === 'edit' ? 'Save question' : 'Add question'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}
