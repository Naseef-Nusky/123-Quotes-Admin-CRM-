import { useEffect, useMemo, useState } from 'react'
import { FolderTree, HelpCircle, Plus, Search } from 'lucide-react'
import { PRO_SERVICES } from '../data/proServices.js'
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

const STORAGE_KEY = '123quotes_pro_services_v1'
const CHILD_TYPES = ['Radio Button', 'Checkbox', 'Dropdown', 'Text']

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function nextQuestionId(services) {
  let max = 0
  for (const s of services) {
    for (const qq of s.questions || []) {
      const n = Number(qq.id)
      if (!Number.isNaN(n) && n > max) max = n
    }
  }
  return max + 1
}

function loadServices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(PRO_SERVICES)
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : structuredClone(PRO_SERVICES)
  } catch {
    return structuredClone(PRO_SERVICES)
  }
}

function emptyAnswer() {
  return { label: '', nextQuestion: 'End' }
}

export default function ProMgmt() {
  const [services, setServices] = useState(() => loadServices())
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [flash, setFlash] = useState('')
  const [error, setError] = useState('')
  const [catModal, setCatModal] = useState(null)
  const [qModal, setQModal] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services))
  }, [services])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return services
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.questions || []).some(
          (qq) =>
            qq.text.toLowerCase().includes(term) ||
            (qq.answers || []).some((a) => a.label.toLowerCase().includes(term)),
        ),
    )
  }, [services, q])

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !filtered.some((s) => s.id === selectedId)) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  const selected = filtered.find((s) => s.id === selectedId) || null
  const withQuestions = services.filter((s) => s.questions?.length).length

  function flashMsg(msg) {
    setFlash(msg)
    setError('')
    setTimeout(() => setFlash(''), 2200)
  }

  function openAddCategory() {
    setCatModal({ mode: 'add', name: '', childType: 'Radio Button' })
    setError('')
  }

  function openEditCategory(service) {
    setCatModal({
      mode: 'edit',
      id: service.id,
      name: service.name,
      childType: service.childType || 'Radio Button',
    })
    setError('')
  }

  function saveCategory(e) {
    e.preventDefault()
    const name = catModal.name.trim()
    if (!name) {
      setError('Category name is required.')
      return
    }

    if (catModal.mode === 'add') {
      if (services.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
        setError('A parent category with this name already exists.')
        return
      }
      const id = `${slugify(name) || 'category'}-${Date.now().toString(36)}`
      const row = {
        id,
        name,
        childType: catModal.childType || 'Radio Button',
        questions: [],
      }
      setServices((rows) => [row, ...rows])
      setSelectedId(id)
      setCatModal(null)
      flashMsg('Parent category added.')
      return
    }

    setServices((rows) =>
      rows.map((s) =>
        s.id === catModal.id
          ? { ...s, name, childType: catModal.childType || 'Radio Button' }
          : s,
      ),
    )
    setCatModal(null)
    flashMsg('Category updated.')
  }

  function deleteCategory(service) {
    if (!window.confirm(`Delete “${service.name}” and all its questions?`)) return
    setServices((rows) => rows.filter((s) => s.id !== service.id))
    flashMsg('Category deleted.')
  }

  function openAddQuestion(service) {
    setQModal({
      mode: 'add',
      serviceId: service.id,
      text: '',
      childType: service.childType || 'Radio Button',
      categoryHeader: 'Default',
      next: 'End',
      answers: [emptyAnswer(), emptyAnswer()],
    })
    setError('')
  }

  function openEditQuestion(service, question) {
    setQModal({
      mode: 'edit',
      serviceId: service.id,
      questionId: question.id,
      text: question.text || '',
      childType: question.childType || 'Radio Button',
      categoryHeader: question.categoryHeader || 'Default',
      next: question.next || 'End',
      answers: question.answers?.length
        ? question.answers.map((a) => ({ ...a }))
        : [emptyAnswer()],
    })
    setError('')
  }

  function saveQuestion(e) {
    e.preventDefault()
    const text = qModal.text.trim()
    if (!text) {
      setError('Question text is required.')
      return
    }

    const answers = (qModal.answers || [])
      .map((a) => ({
        label: String(a.label || '').trim(),
        nextQuestion: String(a.nextQuestion || 'End').trim() || 'End',
      }))
      .filter((a) => a.label)

    const payload = {
      text,
      childType: qModal.childType || 'Radio Button',
      categoryHeader: qModal.categoryHeader || 'Default',
      next: qModal.next || 'End',
      answers,
    }

    if (qModal.mode === 'add') {
      const id = nextQuestionId(services)
      setServices((rows) =>
        rows.map((s) =>
          s.id === qModal.serviceId
            ? { ...s, questions: [...(s.questions || []), { id, ...payload }] }
            : s,
        ),
      )
      setQModal(null)
      flashMsg('Question added.')
      return
    }

    setServices((rows) =>
      rows.map((s) =>
        s.id === qModal.serviceId
          ? {
              ...s,
              questions: (s.questions || []).map((qq) =>
                qq.id === qModal.questionId ? { ...qq, ...payload } : qq,
              ),
            }
          : s,
      ),
    )
    setQModal(null)
    flashMsg('Question updated.')
  }

  function deleteQuestion(serviceId, question) {
    if (!window.confirm(`Delete question “${question.text}”?`)) return
    setServices((rows) =>
      rows.map((s) =>
        s.id === serviceId
          ? { ...s, questions: (s.questions || []).filter((qq) => qq.id !== question.id) }
          : s,
      ),
    )
    flashMsg('Question deleted.')
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
        subtitle="Manage parent categories and their questionnaire flows."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(services))
                flashMsg('Saved.')
              }}
            >
              Save
            </Button>
            <Button onClick={openAddCategory}>
              <Plus className="mr-1.5 size-4" />
              Add category
            </Button>
          </div>
        }
      />

      {flash ? <p className="mb-4 text-sm font-semibold text-ok">{flash}</p> : null}
      <ErrorBanner message={error} />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Parents</p>
          <p className="mt-1 text-2xl font-bold text-navy">{services.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">With questions</p>
          <p className="mt-1 text-2xl font-bold text-navy">{withQuestions}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected</p>
          <p className="mt-1 truncate text-lg font-bold text-blue">{selected?.name || '—'}</p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex h-[calc(100vh-14rem)] min-h-[520px] flex-col lg:flex-row">
          {/* Left: parent categories — own scroll */}
          <aside className="flex max-h-[42vh] w-full flex-col border-b border-slate-200 lg:max-h-none lg:h-full lg:w-[340px] lg:shrink-0 lg:border-b-0 lg:border-r">
            <div className="shrink-0 space-y-3 border-b border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FolderTree className="size-4 text-blue" />
                  <p className="text-sm font-bold text-navy">Parent categories</p>
                </div>
                <Button className="!px-2.5 !py-1.5 text-xs" onClick={openAddCategory}>
                  <Plus className="size-3.5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                  placeholder="Search category…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {filtered.map((service) => {
                const active = selected?.id === service.id
                const count = service.questions?.length || 0
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedId(service.id)}
                    className={`w-full border-b border-slate-100 px-4 py-3.5 text-left transition ${
                      active
                        ? 'border-l-4 border-l-blue bg-blue/5'
                        : 'border-l-4 border-l-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm font-semibold leading-snug ${
                          active ? 'text-blue' : 'text-navy'
                        }`}
                      >
                        {service.name}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          count ? 'bg-emerald-50 text-ok' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{service.childType}</p>
                  </button>
                )
              })}
              {!filtered.length ? (
                <p className="p-6 text-center text-sm text-slate-500">No categories found.</p>
              ) : null}
            </div>
          </aside>

          {/* Right: category detail + questions — own scroll */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-canvas/40">
            {selected ? (
              <>
                <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Category
                      </p>
                      <h2 className="mt-1 text-2xl font-bold text-navy">{selected.name}</h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-semibold text-blue">
                          {selected.childType}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {selected.questions?.length || 0} question
                          {(selected.questions?.length || 0) === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openEditCategory(selected)}>
                        Edit category
                      </Button>
                      <Button variant="danger" onClick={() => deleteCategory(selected)}>
                        Delete
                      </Button>
                      <Button onClick={() => openAddQuestion(selected)}>
                        <Plus className="mr-1.5 size-4" />
                        Add question
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 sm:p-7">
                  {!selected.questions?.length ? (
                    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                      <HelpCircle className="size-10 text-slate-300" />
                      <p className="mt-4 text-base font-semibold text-navy">No questions yet</p>
                      <p className="mt-1 max-w-sm text-sm text-slate-500">
                        Add the first question for this parent category. Answers can point to the next
                        question in the flow.
                      </p>
                      <Button className="mt-5" onClick={() => openAddQuestion(selected)}>
                        Add first question
                      </Button>
                    </div>
                  ) : (
                    selected.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex size-7 items-center justify-center rounded-full bg-blue text-xs font-bold text-white">
                                {index + 1}
                              </span>
                              <span className="rounded bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                                ID {question.id}
                              </span>
                              <span className="rounded bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                                {question.childType}
                              </span>
                            </div>
                            <p className="mt-2 text-base font-bold text-navy">{question.text}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Header: {question.categoryHeader || 'Default'} · Next:{' '}
                              {question.next || 'End'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => openEditQuestion(selected, question)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => deleteQuestion(selected.id, question)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="px-5 py-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Answer branches
                          </p>
                          {question.answers?.length ? (
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                  <tr>
                                    <th className="px-4 py-2.5 font-semibold">Answer</th>
                                    <th className="px-4 py-2.5 font-semibold">Goes to next</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {question.answers.map((ans) => (
                                    <tr
                                      key={`${question.id}-${ans.label}`}
                                      className="border-t border-slate-100"
                                    >
                                      <td className="px-4 py-3 font-medium text-navy">{ans.label}</td>
                                      <td className="px-4 py-3 text-slate-600">
                                        {ans.nextQuestion || 'End'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
                              No answers configured — flow ends here.
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <FolderTree className="size-10 text-slate-300" />
                <p className="mt-3 font-semibold text-navy">Select a parent category</p>
                <p className="mt-1 text-sm text-slate-500">
                  Or add a new one to start building questions.
                </p>
                <Button className="mt-4" onClick={openAddCategory}>
                  Add parent category
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Modal
        open={!!catModal}
        title={catModal?.mode === 'edit' ? 'Edit parent category' : 'Add parent category'}
        onClose={() => setCatModal(null)}
      >
        {catModal ? (
          <form className="space-y-3" onSubmit={saveCategory}>
            <Input
              label="Category name"
              value={catModal.name}
              onChange={(e) => setCatModal((m) => ({ ...m, name: e.target.value }))}
              placeholder="e.g. Web Development"
              required
            />
            <Select
              label="Default child type"
              value={catModal.childType}
              onChange={(e) => setCatModal((m) => ({ ...m, childType: e.target.value }))}
            >
              {CHILD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setCatModal(null)}>
                Cancel
              </Button>
              <Button type="submit">
                {catModal.mode === 'edit' ? 'Save changes' : 'Create category'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={!!qModal}
        title={qModal?.mode === 'edit' ? 'Edit question' : 'Add question'}
        onClose={() => setQModal(null)}
        wide
      >
        {qModal ? (
          <form className="space-y-4" onSubmit={saveQuestion}>
            <Textarea
              label="Question"
              rows={2}
              value={qModal.text}
              onChange={(e) => setQModal((m) => ({ ...m, text: e.target.value }))}
              placeholder="e.g. What service do you require?"
              required
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <Select
                label="Child type"
                value={qModal.childType}
                onChange={(e) => setQModal((m) => ({ ...m, childType: e.target.value }))}
              >
                {CHILD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <Input
                label="Category header"
                value={qModal.categoryHeader}
                onChange={(e) => setQModal((m) => ({ ...m, categoryHeader: e.target.value }))}
              />
              <Input
                label="Default next"
                value={qModal.next}
                onChange={(e) => setQModal((m) => ({ ...m, next: e.target.value }))}
                placeholder="End"
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-navy">Answers</p>
                  <p className="text-xs text-slate-500">Each answer can send the user to the next question.</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setQModal((m) => ({ ...m, answers: [...(m.answers || []), emptyAnswer()] }))
                  }
                >
                  + Answer
                </Button>
              </div>
              <div className="space-y-3">
                {(qModal.answers || []).map((ans, idx) => (
                  <div
                    key={idx}
                    className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <Input
                      label={`Answer ${idx + 1}`}
                      value={ans.label}
                      onChange={(e) => updateAnswerRow(idx, 'label', e.target.value)}
                      placeholder="Option text"
                    />
                    <Input
                      label="Next question"
                      value={ans.nextQuestion}
                      onChange={(e) => updateAnswerRow(idx, 'nextQuestion', e.target.value)}
                      placeholder="End or next question text"
                    />
                    <div className="flex items-end">
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
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="secondary" onClick={() => setQModal(null)}>
                Cancel
              </Button>
              <Button type="submit">
                {qModal.mode === 'edit' ? 'Save question' : 'Add question'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}
