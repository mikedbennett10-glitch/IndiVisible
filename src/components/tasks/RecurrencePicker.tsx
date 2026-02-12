import { Repeat, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import {
  RECURRENCE_PRESETS,
  decodeRecurrenceRule,
  encodeRecurrenceRule,
  getRecurrenceLabel,
  type RecurrenceRule,
} from '@/lib/recurrence'
import clsx from 'clsx'

interface RecurrencePickerProps {
  value: string | null
  onChange: (value: string | null) => void
}

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const currentRule = decodeRecurrenceRule(value)

  function handleSelect(rule: RecurrenceRule) {
    const encoded = encodeRecurrenceRule(rule)
    // Toggle off if same rule selected
    if (value === encoded) {
      onChange(null)
    } else {
      onChange(encoded)
    }
  }

  function handleClear() {
    onChange(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-1.5 text-xs font-medium text-warm-500">
          <Repeat size={12} />
          Recurrence
        </label>
        {currentRule && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-[11px] text-warm-400 hover:text-warm-600"
          >
            <X size={10} />
            Clear
          </button>
        )}
      </div>

      {currentRule && (
        <div className="mb-2">
          <Badge variant="primary">{getRecurrenceLabel(currentRule)}</Badge>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {RECURRENCE_PRESETS.map((preset) => {
          const encoded = encodeRecurrenceRule(preset.rule)
          const isSelected = value === encoded
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleSelect(preset.rule)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                isSelected
                  ? 'bg-primary-500 text-white'
                  : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
              )}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
