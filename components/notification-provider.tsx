"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type NotificationType = "success" | "error" | "info" | "warning"

interface Notification {
  id: string
  message: string
  type: NotificationType
  duration?: number
}

interface NotificationContextType {
  notifications: Notification[]
  showNotification: (message: string, type?: NotificationType, duration?: number) => void
  dismissNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = useCallback((message: string, type: NotificationType = "info", duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9)

    setNotifications((prev) => [...prev, { id, message, type, duration }])

    if (duration !== Number.POSITIVE_INFINITY) {
      setTimeout(() => {
        dismissNotification(id)
      }, duration)
    }

    return id
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, dismissNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

function NotificationContainer() {
  const context = useContext(NotificationContext)

  if (!context) {
    return null
  }

  const { notifications, dismissNotification } = context

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 md:bottom-6 md:right-6">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onDismiss={dismissNotification} />
      ))}
    </div>
  )
}

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification
  onDismiss: (id: string) => void
}) {
  const getTypeStyles = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "bg-[#06D6A0] border-black text-black"
      case "error":
        return "bg-[#EF476F] border-black text-white"
      case "warning":
        return "bg-[#FFD166] border-black text-black"
      default:
        return "bg-[#118AB2] border-black text-white"
    }
  }

  return (
    <div
      className={cn(
        "animate-slide-up w-full max-w-sm rounded-lg border-2 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        getTypeStyles(notification.type),
      )}
    >
      <div className="flex items-start justify-between">
        <p className="flex-1 font-medium">{notification.message}</p>
        <button onClick={() => onDismiss(notification.id)} className="ml-4 rounded-full p-1 hover:bg-black/10">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }

  return context
}

