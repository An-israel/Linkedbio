import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/* ---------- Toast ---------- */

interface Toast {
  id: number
  message: string
  tone: 'success' | 'danger'
}

const ToastContext = createContext<(message: string, tone?: Toast['tone']) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const push = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = nextId.current++
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`toast-in px-4 py-2.5 rounded-[10px] bg-graphite border text-sm ${
              t.tone === 'danger' ? 'border-danger/60 text-danger' : 'border-steel text-platinum'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/* ---------- Confirm dialog ---------- */

interface ConfirmProps {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }: ConfirmProps) {
  return (
    <div
      className="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center p-5 bg-obsidian/70 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="modal-card w-full max-w-[360px] bg-graphite border border-steel rounded-[14px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="display text-platinum text-lg">{title}</h2>
        <p className="text-mist text-sm mt-2">{body}</p>
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onCancel} className={btnSecondary + ' flex-1'}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 min-h-10 rounded-[10px] bg-danger/15 border border-danger/60 text-danger text-sm font-medium hover:bg-danger/25 transition-colors cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Shared field styles ---------- */

export const inputClass =
  'w-full min-h-10 rounded-[8px] bg-obsidian border border-steel px-3 py-2 text-sm text-platinum ' +
  'placeholder:text-mist/60 focus:border-silver transition-colors'

export const btnPrimary =
  'min-h-10 rounded-[10px] px-4 bg-steel border border-silver/60 text-white text-sm font-medium ' +
  'hover:border-silver transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

export const btnSecondary =
  'min-h-10 rounded-[10px] px-4 bg-graphite border border-steel text-mist text-sm ' +
  'hover:text-platinum hover:border-silver/50 transition-colors cursor-pointer'

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mono-label block mb-1.5">{children}</span>
}

/** URL validation shared by the link editor and appearance forms. */
export function isValidUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/** Toggle switch styled to the palette. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5.5 w-10 rounded-full border transition-colors cursor-pointer shrink-0 ${
        checked ? 'bg-success/25 border-success/70' : 'bg-obsidian border-steel'
      }`}
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full transition-all ${
          checked ? 'left-[21px] bg-success' : 'left-[3px] bg-mist'
        }`}
      />
    </button>
  )
}
