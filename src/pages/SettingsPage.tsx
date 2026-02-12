import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Copy, Check, RefreshCw, LogOut, Users, User, Info } from 'lucide-react'

export function SettingsPage() {
  const { profile, household, signOut, refreshProfile } = useAuth()
  const { members } = useHouseholdMembers()
  const toast = useToast()

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)

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
    </div>
  )
}
