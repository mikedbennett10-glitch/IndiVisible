import { useNavigate } from 'react-router-dom'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { ICON_MAP } from '@/components/ui/IconPicker'
import { useState, useRef, useEffect } from 'react'
import type { List } from '@/types'

interface ListCardProps {
  list: List
  taskCount: { incomplete: number; total: number }
  onEdit: (list: List) => void
  onDelete: (list: List) => void
}

export function ListCard({ list, taskCount, onEdit, onDelete }: ListCardProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const Icon = ICON_MAP[list.icon] ?? ICON_MAP['list']!

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div
      className="bg-white rounded-xl shadow-sm shadow-warm-200/50 border border-warm-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/lists/${list.id}`)}
    >
      <div className="flex">
        <div className="w-1.5 shrink-0" style={{ backgroundColor: list.color }} />
        <div className="flex-1 p-4 flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: list.color + '18', color: list.color }}
          >
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-warm-900 truncate">{list.name}</h3>
            <p className="text-xs text-warm-400 mt-0.5">
              {taskCount.incomplete} of {taskCount.total} remaining
            </p>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="p-1.5 rounded-lg text-warm-300 hover:text-warm-500 hover:bg-warm-100 transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 w-36 bg-white rounded-lg shadow-lg border border-warm-100 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onEdit(list)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-warm-700 hover:bg-warm-50"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onDelete(list)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-500 hover:bg-danger-50"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
