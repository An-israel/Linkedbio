import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../lib/supabase'
import { LINK_CAP } from '../lib/types'
import type { Link, LinkInput, Profile } from '../lib/types'
import { DragHandleIcon } from '../components/icons'
import { LinkEditor } from './LinkEditor'
import { ConfirmDialog, Toggle, btnPrimary, useToast } from '../admin/ui'

function SortableRow({
  link,
  onEdit,
  onDelete,
  onToggleVisible,
}: {
  link: Link
  onEdit: (l: Link) => void
  onDelete: (l: Link) => void
  onToggleVisible: (l: Link, visible: boolean) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 bg-graphite border border-steel rounded-[10px] px-3 py-3 ${
        isDragging ? 'opacity-70 border-silver z-10 relative' : ''
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${link.title}`}
        className="text-mist hover:text-silver cursor-grab active:cursor-grabbing touch-none p-1"
      >
        <DragHandleIcon className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="display text-platinum text-sm truncate">{link.title}</span>
          {link.category && <span className="mono-label text-[10px]">{link.category}</span>}
          {link.description && (
            <span className="mono-label text-[10px] border border-steel rounded px-1.5 py-0.5">
              popup
            </span>
          )}
          {link.featured && (
            <span className="mono-label text-[10px] border border-silver/50 rounded px-1.5 py-0.5">
              featured
            </span>
          )}
          {link.flagged && (
            <span className="mono-label text-[10px] border border-danger/60 text-danger rounded px-1.5 py-0.5">
              flagged
            </span>
          )}
        </div>
        <span className="block text-mist text-xs mt-0.5 truncate">{link.url}</span>
      </div>

      <span className="mono-label text-mist shrink-0 hidden sm:block">
        {link.click_count} clicks
      </span>

      <Toggle
        checked={link.visible}
        onChange={(v) => onToggleVisible(link, v)}
        label={`${link.title} visible`}
      />

      <button
        type="button"
        onClick={() => onEdit(link)}
        className="mono-label text-mist hover:text-silver transition-colors cursor-pointer p-1"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => onDelete(link)}
        className="mono-label text-mist hover:text-danger transition-colors cursor-pointer p-1"
      >
        Delete
      </button>
    </li>
  )
}

export function MyLinks() {
  const { profile } = useOutletContext<{ profile: Profile }>()
  const toast = useToast()
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Link | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Link | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const loadLinks = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', profile.id)
      .order('sort_order')
    if (error) toast('Failed to load links: ' + error.message, 'danger')
    else setLinks((data as Link[]) ?? [])
    setLoading(false)
  }, [profile.id, toast])

  useEffect(() => {
    void loadLinks()
  }, [loadLinks])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = links.findIndex((l) => l.id === active.id)
    const newIndex = links.findIndex((l) => l.id === over.id)
    const reordered = arrayMove(links, oldIndex, newIndex).map((l, i) => ({
      ...l,
      sort_order: i,
    }))
    setLinks(reordered) // optimistic

    if (!supabase) return
    const results = await Promise.all(
      reordered.map((l) =>
        supabase!.from('links').update({ sort_order: l.sort_order }).eq('id', l.id)
      )
    )
    if (results.some((r) => r.error)) {
      toast('Failed to save the new order', 'danger')
      void loadLinks()
    }
  }

  async function handleToggleVisible(link: Link, visible: boolean) {
    setLinks((ls) => ls.map((l) => (l.id === link.id ? { ...l, visible } : l)))
    if (!supabase) return
    const { error } = await supabase.from('links').update({ visible }).eq('id', link.id)
    if (error) {
      toast('Failed to update visibility', 'danger')
      void loadLinks()
    }
  }

  async function handleSave(input: LinkInput, id?: string) {
    if (!supabase) {
      toast('Backend not configured', 'danger')
      return
    }
    if (id) {
      const { error } = await supabase.from('links').update(input).eq('id', id)
      if (error) {
        toast('Save failed: ' + error.message, 'danger')
        return
      }
      toast('Link updated')
    } else {
      const { error } = await supabase.from('links').insert(input)
      if (error) {
        toast('Save failed: ' + error.message, 'danger')
        return
      }
      toast('Link added')
    }
    setEditing(null)
    setCreating(false)
    void loadLinks()
  }

  async function handleDelete() {
    if (!deleting || !supabase) {
      setDeleting(null)
      return
    }
    const target = deleting
    setDeleting(null)
    setLinks((ls) => ls.filter((l) => l.id !== target.id))
    const { error } = await supabase.from('links').delete().eq('id', target.id)
    if (error) {
      toast('Delete failed: ' + error.message, 'danger')
      void loadLinks()
    } else {
      toast('Link deleted')
    }
  }

  const atCap = links.length >= LINK_CAP

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <p className="mono-label">My Links</p>
          <h1 className="display text-platinum text-xl mt-1">
            lynkit.link/{profile.username}
          </h1>
          <p className="text-mist text-xs mt-1">
            {links.length} / {LINK_CAP} links
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          disabled={atCap}
          className={btnPrimary}
          title={atCap ? `Limit of ${LINK_CAP} links reached` : undefined}
        >
          Add link
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-[10px]" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="border border-steel border-dashed rounded-[10px] p-10 text-center">
          <p className="text-mist text-sm">
            No links yet. Add your first link — it appears on your public page instantly.
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-3">
              {links.map((link) => (
                <SortableRow
                  key={link.id}
                  link={link}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                  onToggleVisible={handleToggleVisible}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {(creating || editing) && (
        <LinkEditor
          link={editing}
          userId={profile.id}
          nextSortOrder={links.length}
          onSave={handleSave}
          onClose={() => {
            setEditing(null)
            setCreating(false)
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete link?"
          body={`"${deleting.title}" will be removed permanently, along with its click history.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
