import clsx from 'clsx'
import { Check } from 'lucide-react'

const PRESET_COLORS = [
  '#a67434', // primary gold
  '#c44d4d', // warm red
  '#d4a03a', // amber
  '#5a9a5a', // sage green
  '#4a8ab5', // ocean blue
  '#7b5ea7', // muted purple
  '#c47a5a', // terra cotta
  '#5a8a8a', // teal
  '#8a6a5a', // brown
  '#6b8f6b', // forest
  '#b05a7a', // dusty rose
  '#3d7a9a', // steel blue
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={clsx('flex flex-wrap gap-2', className)}>
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110',
            value === color && 'ring-2 ring-offset-2 ring-warm-400'
          )}
          style={{ backgroundColor: color }}
        >
          {value === color && <Check size={14} className="text-white" />}
        </button>
      ))}
    </div>
  )
}

export { PRESET_COLORS }
