import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from './ui.jsx'

/**
 * Permanent bulk delete with typed confirmation.
 */
export default function DeleteAllButton({
  label = 'Delete all',
  confirmText,
  confirmWord = 'DELETE',
  onConfirm,
  disabled = false,
}) {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    const message =
      confirmText ||
      `This permanently deletes ALL records from the database and cannot be undone.\n\nType ${confirmWord} to confirm.`
    const typed = window.prompt(message)
    if (typed == null) return
    if (String(typed).trim().toUpperCase() !== confirmWord.toUpperCase()) {
      window.alert(`Cancelled — you must type ${confirmWord} exactly.`)
      return
    }
    setBusy(true)
    try {
      await onConfirm()
    } catch (err) {
      window.alert(err.message || 'Delete all failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant="danger"
      onClick={handleClick}
      disabled={disabled || busy}
      className="!bg-red-600 hover:!bg-red-700"
    >
      <Trash2 className="mr-1.5 size-4" />
      {busy ? 'Deleting…' : label}
    </Button>
  )
}
