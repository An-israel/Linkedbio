import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { signOut } from '../hooks/useAuth'
import type { Profile, Socials } from '../lib/types'
import { isValidHttpUrl, validateUsername } from '../lib/validation'
import { ConfirmDialog, FieldLabel, btnPrimary, btnSecondary, inputClass, useToast } from '../admin/ui'

const SOCIAL_FIELDS: { key: keyof Socials; label: string }[] = [
  { key: 'instagram', label: 'Instagram URL' },
  { key: 'tiktok', label: 'TikTok URL' },
  { key: 'x', label: 'X (Twitter) URL' },
  { key: 'youtube', label: 'YouTube URL' },
  { key: 'facebook', label: 'Facebook URL' },
]

export function Settings() {
  const { profile } = useOutletContext<{ profile: Profile }>()
  const toast = useToast()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [socials, setSocials] = useState<Socials>(profile.socials ?? {})
  const [username, setUsername] = useState(profile.username)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  async function handleAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !supabase) return
    setUploading(true)
    const path = `${profile.id}/avatar-${Date.now()}.${file.name.split('.').pop() || 'png'}`
    const { error } = await supabase.storage.from('avatars').upload(path, file)
    setUploading(false)
    if (error) {
      toast('Upload failed: ' + error.message, 'danger')
      return
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(data.publicUrl)
    toast('Avatar uploaded — remember to Save')
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return

    for (const { key, label } of SOCIAL_FIELDS) {
      const v = (socials[key] ?? '').trim()
      if (v && !isValidHttpUrl(v)) {
        toast(`${label} must start with http:// or https://`, 'danger')
        return
      }
    }

    const cleanUsername = username.trim().toLowerCase()
    if (cleanUsername !== profile.username) {
      const err = validateUsername(cleanUsername)
      if (err) {
        setUsernameError(err)
        return
      }
      const { data: check } = await supabase.rpc('check_username', { p_username: cleanUsername })
      if (check) {
        setUsernameError(check as string)
        return
      }
    }
    setUsernameError(null)

    setSaving(true)
    const cleanSocials: Socials = {}
    for (const { key } of SOCIAL_FIELDS) {
      const v = (socials[key] ?? '').trim()
      if (v) cleanSocials[key] = v
    }
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
        socials: cleanSocials,
        username: cleanUsername,
      })
      .eq('id', profile.id)
    setSaving(false)
    if (error) {
      toast('Save failed: ' + error.message, 'danger')
      return
    }
    toast('Settings saved')
    if (cleanUsername !== profile.username) {
      toast('Username changed — your old link no longer works', 'success')
      window.location.reload()
    }
  }

  async function handlePassword() {
    if (!supabase || newPassword.length < 8) {
      toast('Password must be at least 8 characters', 'danger')
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast(error.message, 'danger')
    else {
      setNewPassword('')
      toast('Password updated')
    }
  }

  async function handleDelete() {
    if (!supabase) return
    // Full auth-user deletion needs a service key; clearing the profile
    // cascades all content and frees the username, then signs out.
    const { error } = await supabase.from('profiles').delete().eq('id', profile.id)
    if (error) {
      toast('Delete failed: ' + error.message, 'danger')
      return
    }
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <form onSubmit={handleSave} className="max-w-xl">
      <p className="mono-label">Settings</p>
      <h1 className="display text-platinum text-xl mt-1 mb-7">Profile & account</h1>

      <div className="flex flex-col gap-6">
        <div>
          <FieldLabel>Avatar</FieldLabel>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-obsidian border border-steel overflow-hidden flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-mist text-xs">None</span>
              )}
            </div>
            <div className="flex gap-2">
              <label className={btnSecondary + ' inline-flex items-center cursor-pointer'}>
                {uploading ? 'Uploading…' : 'Upload'}
                <input type="file" accept="image/*" className="sr-only" onChange={handleAvatar} disabled={uploading} />
              </label>
              {avatarUrl && (
                <button type="button" onClick={() => setAvatarUrl('')} className={btnSecondary}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <label>
          <FieldLabel>Display name</FieldLabel>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} />
        </label>

        <label>
          <FieldLabel>Bio</FieldLabel>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className={inputClass + ' resize-y'} />
        </label>

        <label>
          <FieldLabel>Username</FieldLabel>
          <div
            className={`flex items-center bg-obsidian border rounded-[8px] px-3 transition-colors focus-within:border-silver ${
              usernameError ? 'border-danger' : 'border-steel'
            }`}
          >
            <span className="text-mist text-sm shrink-0 select-none">lynkit.link/</span>
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setUsernameError(null)
              }}
              className="w-full bg-transparent border-0 outline-none text-platinum text-sm py-2.5 min-w-0"
            />
          </div>
          {usernameError && <span className="block text-danger text-xs mt-1.5">{usernameError}</span>}
          <span className="block text-warning/90 text-xs mt-1.5">
            Changing your username breaks your old link immediately — update your bios everywhere.
          </span>
        </label>

        {SOCIAL_FIELDS.map(({ key, label }) => (
          <label key={key}>
            <FieldLabel>{label}</FieldLabel>
            <input
              value={socials[key] ?? ''}
              onChange={(e) => setSocials((s) => ({ ...s, [key]: e.target.value }))}
              className={inputClass}
              placeholder="https://…"
            />
          </label>
        ))}

        <button type="submit" disabled={saving} className={btnPrimary + ' w-full'}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>

        <div className="border-t border-steel pt-6">
          <FieldLabel>Change password</FieldLabel>
          <div className="flex gap-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="New password (8+ characters)"
              className={inputClass}
            />
            <button type="button" onClick={handlePassword} className={btnSecondary + ' shrink-0'}>
              Update
            </button>
          </div>
        </div>

        <div className="border-t border-danger/30 pt-6">
          <FieldLabel>Danger zone</FieldLabel>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="min-h-10 rounded-[10px] px-4 bg-danger/10 border border-danger/50 text-danger text-sm hover:bg-danger/20 transition-colors cursor-pointer"
          >
            Delete my account
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete your account?"
          body={`This permanently deletes lynkit.link/${profile.username}, all your links, and your analytics. There is no undo.`}
          confirmLabel="Delete forever"
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </form>
  )
}
