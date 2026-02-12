import { MessageCircle, Calendar, Clock } from 'lucide-react'

const iconMap: Record<string, typeof MessageCircle> = {
  'message-circle': MessageCircle,
  calendar: Calendar,
}

interface ComingSoonPageProps {
  title: string
  description: string
  icon: string
}

export function ComingSoonPage({ title, description, icon }: ComingSoonPageProps) {
  const IconComponent = iconMap[icon] ?? Clock

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
        <IconComponent size={28} className="text-primary-400" />
      </div>
      <h2 className="text-xl font-semibold text-warm-800 mb-2">{title}</h2>
      <p className="text-sm text-warm-500 max-w-xs">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary-500 bg-primary-50 px-3 py-1.5 rounded-full">
        <Clock size={12} />
        Coming Soon
      </span>
    </div>
  )
}
