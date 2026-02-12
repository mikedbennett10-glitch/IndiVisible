import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Copy, Check, RefreshCw, LogOut, Users, User, Info, Bell, BellOff, Sun, Moon, Monitor, DoorOpen } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeMode } from '@/contexts/ThemeContext'
import clsx from 'clsx'

export function SettingsPage() {
  const navigate = useNavigate()
  const { profile, household, signOut, refreshProfile } = useAuth()
  const { members } = useHouseholdMembers()
  const toast = useToast()

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
  const [showLeaveHousehold, setShowLeaveHousehold] = useState(false)
  const [leavingHousehold, setLeavingHousehold] = useState(false)
  const { permission, subscribed, loading: pushLoading, subscribe, unsubscribe, isSupported } = usePushNotifications()
  const [pushToggling, setPushToggling] = useState(false)
  const { mode: themeMode, setMode: setThemeMode } = useTheme()

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  async function handleSaveName() {
    if (!profile || !displayName.trim()) return
    setSavingName(true)
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', profile.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Name updated')
      await refreshProfile()
    }
    setSavingName(false)
  }

  async function handleColorChange(color: string) {
    if (!profile) return
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_color: color })
      .eq('id', profile.id)

    if (error) {
      toast.error(error.message)
    } else {
      await refreshProfile()
    }
  }

  function handleCopyCode() {
    if (!household?.invite_code) return
    navigator.clipboard.writeText(household.invite_code)
    setCopied(true)
    toast.success('Invite code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerateCode() {
    if (!household) return
    const newCode = Math.random().toString(36).substring(2, 10)
    const { error } = await supabase
      .from('households')
      .update({ invite_code: newCode })
      .eq('id', household.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Invite code regenerated')
      await refreshProfile()
    }
  }

  async function handleLeaveHousehold() {
    if (!profile) return
    setLeavingHousehold(true)
    const { error } = await supabase
      .from('profiles')
      .update({ household_id: null })
      .eq('id', profile.id)

    if (error) {
      toast.error(error.message)
      setLeavingHousehold(false)
    } else {
      await refreshProfile()
      navigate('/household-setup')
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-warm-900">Settings</h1>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-2 mb-4 text-warm-600">
          <User size={16} />
          <h2 className="text-sm font-semibold">Profile</h2>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <Avatar
            name={profile?.display_name ?? ''}
            color={profile?.avatar_color ?? '#a67434'}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-warm-900 truncate">{profile?.display_name}</p>
            <p className="text-sm text-warm-400 truncate">{profile?.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-warm-500 mb-1">Display Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-warm-200 bg-white text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
              <Button
                size="sm"
                onClick={handleSaveName}
                loading={savingName}
                disabled={displayName === profile?.display_name}
              >
                Save
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-warm-500 mb-2">Avatar Color</label>
            <ColorPicker
              value={profile?.avatar_color ?? '#a67434'}
              onChange={handleColorChange}
            />
          </div>
        </div>
      </Card>

      {/* Household */}
      <Card>
        <div className="flex items-center gap-2 mb-4 text-warm-600">
          <Users size={16} />
          <h2 className="text-sm font-semibold">Household</h2>
        </div>

        <p className="text-sm text-warm-800 font-medium mb-3">{household?.name}</p>

        {/* Invite Code */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-warm-500 mb-1">Invite Code</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-warm-50 rounded-lg text-center font-mono text-lg tracking-widest text-warm-800 border border-warm-200">
              {household?.invite_code}
            </code>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-lg text-warm-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="Copy code"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
            <button
              onClick={handleRegenerateCode}
              className="p-2 rounded-lg text-warm-400 hover:text-warm-600 hover:bg-warm-100 transition-colors"
              title="Regenerate code"
            >
              <RefreshCw size={18} />
            </button>
          </div>
          <p className="text-[11px] text-warm-400 mt-1">
            Share this code with your partner so they can join your household.
          </p>
        </div>

        {/* Members */}
        <div>
          <label className="block text-xs font-medium text-warm-500 mb-2">Members</label>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-warm-50">
                <Avatar name={member.display_name} color={member.avatar_color} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warm-800 truncate">{member.display_name}</p>
                  <p className="text-xs text-warm-400 truncate">{member.email}</p>
                </div>
                {member.id === profile?.id && (
                  <span className="text-[10px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                    You
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Leave Household */}
        <div className="mt-4 pt-4 border-t border-warm-100">
          <button
            onClick={() => setShowLeaveHousehold(true)}
            className="flex items-center gap-2 text-sm text-danger-500 hover:text-danger-600 font-medium transition-colors"
          >
            <DoorOpen size={16} />
            Leave household
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-2 mb-4 text-warm-600">
          <Bell size={16} />
          <h2 className="text-sm font-semibold">Notifications</h2>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-warm-800">Push Notifications</p>
            <p className="text-xs text-warm-400 mt-0.5">
              {!isSupported
                ? 'Push notifications are not supported in this browser'
                : permission === 'denied'
                  ? 'Notifications are blocked. Enable them in your browser settings.'
                  : subscribed
                    ? 'You will receive push notifications for reminders'
                    : 'Get notified when reminders fire, even when the app is closed'}
            </p>
          </div>
          {isSupported && permission !== 'denied' && (
            <button
              onClick={async () => {
                setPushToggling(true)
                const result = subscribed ? await unsubscribe() : await subscribe()
                if (result.error) toast.error(result.error)
                else toast.success(subscribed ? 'Push notifications disabled' : 'Push notifications enabled')
                setPushToggling(false)
              }}
              disabled={pushLoading || pushToggling}
              className="shrink-0 ml-3 p-2 rounded-lg transition-colors disabled:opacity-50"
              title={subscribed ? 'Disable push notifications' : 'Enable push notifications'}
            >
              {subscribed ? (
                <BellOff size={18} className="text-warm-400" />
              ) : (
                <Bell size={18} className="text-primary-600" />
              )}
            </button>
          )}
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <div className="flex items-center gap-2 mb-4 text-warm-600">
          <Sun size={16} />
          <h2 className="text-sm font-semibold">Appearance</h2>
        </div>

        <div className="flex gap-1 bg-warm-100 rounded-lg p-1">
          {themeOptions.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => setThemeMode(opt.value)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors',
                  themeMode === opt.value
                    ? 'bg-white text-warm-900 shadow-sm'
                    : 'text-warm-500 hover:text-warm-700'
                )}
              >
                <Icon size={14} />
                {opt.label}
              </button>
            )
          })}
        </div>
      </Card>

      {/* App Info */}
      <Card>
        <div className="flex items-center gap-2 mb-3 text-warm-600">
          <Info size={16} />
          <h2 className="text-sm font-semibold">About</h2>
        </div>
        <p className="text-sm text-warm-500">
          Indivisible v1.0 — Make it visible. Share the load.
        </p>
      </Card>

      {/* Sign Out */}
      <Button
        variant="ghost"
        className="w-full text-danger-500 hover:bg-danger-50"
        onClick={() => setShowSignOut(true)}
      >
        <LogOut size={16} />
        Sign Out
      </Button>

      <ConfirmDialog
        open={showSignOut}
        onClose={() => setShowSignOut(false)}
        onConfirm={signOut}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
      />

      <ConfirmDialog
        open={showLeaveHousehold}
        onClose={() => setShowLeaveHousehold(false)}
        onConfirm={handleLeaveHousehold}
        title="Leave Household"
        message="You'll lose access to all shared lists and tasks. You can join another household or create a new one afterward."
        confirmLabel={leavingHousehold ? 'Leaving...' : 'Leave'}
      />
    </div>
  )
}
