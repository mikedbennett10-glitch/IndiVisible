import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { IconPicker } from '@/components/ui/IconPicker'
import { ColorPicker } from '@/components/ui/ColorPicker'
import type { List } from '@/types'

interface ListFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; icon: string; color: string }) => Promise<void>
  list?: List | null
}

export function ListFormModal({ open, onClose, onSubmit, list }: ListFormModalProps) {
  const [name, setName] = useState(list?.name ?? '')
  const [icon, setIcon] = useState(list?.icon ?? 'list')
  const [color, setColor] = useState(list?.color ?? '#a67434')
  const [submitting, setSubmitting] = useState(false)

  // Reset form when modal opens with different list
  const isEditing = !!list

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    await onSubmit({ name: name.trim(), icon, color })
    setSubmitting(false)
    setName('')
    setIcon('list')
    setColor('#a67434')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit List' : 'Create List'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="list-name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Groceries, House Projects"
          required
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-2">Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-2">Icon</label>
          <IconPicker value={icon} onChange={setIcon} color={color} />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditing ? 'Save Changes' : 'Create List'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
