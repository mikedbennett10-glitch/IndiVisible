import clsx from 'clsx'
import {
  Home, ShoppingCart, UtensilsCrossed, Wrench, Car, Heart, Briefcase,
  Dog, Baby, Flower2, Trash2, Sparkles, Clock, Calendar, MapPin,
  Phone, Mail, DollarSign, Pill, Dumbbell, BookOpen, Gift, Plane,
  ListTodo, Star, Lightbulb,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  'shopping-cart': ShoppingCart,
  utensils: UtensilsCrossed,
  wrench: Wrench,
  car: Car,
  heart: Heart,
  briefcase: Briefcase,
  dog: Dog,
  baby: Baby,
  flower: Flower2,
  trash: Trash2,
  sparkles: Sparkles,
  clock: Clock,
  calendar: Calendar,
  'map-pin': MapPin,
  phone: Phone,
  mail: Mail,
  dollar: DollarSign,
  pill: Pill,
  dumbbell: Dumbbell,
  book: BookOpen,
  gift: Gift,
  plane: Plane,
  list: ListTodo,
  star: Star,
  lightbulb: Lightbulb,
}

const ICON_NAMES = Object.keys(ICON_MAP)

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  color?: string
  className?: string
}

export function IconPicker({ value, onChange, color = '#a67434', className }: IconPickerProps) {
  return (
    <div className={clsx('grid grid-cols-6 gap-2', className)}>
      {ICON_NAMES.map((name) => {
        const Icon = ICON_MAP[name]!
        const isSelected = value === name
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
              isSelected
                ? 'ring-2 ring-offset-1 shadow-sm'
                : 'hover:bg-warm-100 text-warm-500'
            )}
            style={
              isSelected
                ? { backgroundColor: color + '20', color, outlineColor: color }
                : undefined
            }
          >
            <Icon size={20} />
          </button>
        )
      })}
    </div>
  )
}
