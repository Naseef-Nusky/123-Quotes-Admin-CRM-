import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

const emptyForm = {
  text: '',
  author: '',
  category: 'motivation',
  published: true,
}

export default function QuotesAdmin() {
  const [quotes, setQuotes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await api.getQuotes()
      setQuotes(data.quotes || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function onChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    try {
      if (editingId) {
        await api.updateQuote(editingId, form)
      } else {
        await api.createQuote(form)
      }
      setForm(emptyForm)
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  function startEdit(quote) {
    setEditingId(quote._id)
    setForm({
      text: quote.text,
      author: quote.author,
      category: quote.category || 'motivation',
      published: quote.published,
    })
  }

  async function remove(id) {
    if (!confirm('Delete this quote?')) return
    try {
      await api.deleteQuote(id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const inputClass =
    'mt-1 w-full rounded-md border border-line/25 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30'

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Quotes</h1>
      <p className="mt-1 text-muted">Create and manage quotes shown on the public site.</p>
      {error && <p className="mt-3 text-sm text-warn">{error}</p>}

      <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-xl border border-line/20 bg-white p-5">
        <h2 className="font-semibold">{editingId ? 'Edit quote' : 'Add quote'}</h2>
        <label className="block text-sm font-medium">
          Text
          <textarea className={`${inputClass} min-h-24`} name="text" value={form.text} onChange={onChange} required />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Author
            <input className={inputClass} name="author" value={form.author} onChange={onChange} required />
          </label>
          <label className="block text-sm font-medium">
            Category
            <select className={inputClass} name="category" value={form.category} onChange={onChange}>
              {['motivation', 'success', 'life', 'leadership', 'wisdom'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="published" checked={form.published} onChange={onChange} />
          Published
        </label>
        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-dark">
            {editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm(emptyForm)
              }}
              className="rounded-md border border-line/30 px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-xl border border-line/20 bg-white">
        {loading ? (
          <p className="p-4 text-sm text-muted">Loading…</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Quote</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote._id} className="border-t border-line/15 align-top">
                  <td className="max-w-md px-4 py-3">{quote.text}</td>
                  <td className="px-4 py-3">{quote.author}</td>
                  <td className="px-4 py-3">{quote.published ? 'Published' : 'Draft'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" className="text-accent hover:underline" onClick={() => startEdit(quote)}>
                        Edit
                      </button>
                      <button type="button" className="text-warn hover:underline" onClick={() => remove(quote._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-muted">
                    No quotes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
