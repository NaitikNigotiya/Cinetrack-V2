import { create } from 'zustand'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface ToastItem {
  id: string
  message: string
  type?: ToastType | undefined
  duration?: number | undefined // ms
  action?: {
    label: string
    onClick: () => void
  } | undefined
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => string
  removeToast: (id: string) => void
}

let toastCounter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))

    const duration = toast.duration ?? (toast.action ? 8000 : 4000)
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }

    return id
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export const toast = {
  success: (message: string, action?: ToastItem['action']) =>
    useToastStore.getState().addToast({ message, type: 'success', action }),
  error: (message: string, action?: ToastItem['action']) =>
    useToastStore.getState().addToast({ message, type: 'error', action }),
  info: (message: string, action?: ToastItem['action']) =>
    useToastStore.getState().addToast({ message, type: 'info', action }),
  warning: (message: string, action?: ToastItem['action']) =>
    useToastStore.getState().addToast({ message, type: 'warning', action }),
}
