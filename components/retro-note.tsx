"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X } from "lucide-react"

interface Note {
  id: string
  content: string
  color: string
  position_x: number
  position_y: number
  user_id: string
  room_id: string
  created_at: string
  user: {
    id: string
    username: string
    avatar_url?: string
    isGuest?: boolean
  }
}

interface RetroNoteProps {
  note: Note
  onDelete: (id: string) => void
  onPositionChange: (id: string, x: number, y: number) => void
  currentUserId: string | Promise<string>
  isRoomCreator?: boolean
  isCompleted?: boolean
}

export default function RetroNote({
  note,
  onDelete,
  onPositionChange,
  currentUserId,
  isRoomCreator = false,
  isCompleted = false,
}: RetroNoteProps) {
  const [position, setPosition] = useState({
    x: note.position_x,
    y: note.position_y,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [userId, setUserId] = useState<string>("")
  const noteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const resolveUserId = async () => {
      if (typeof currentUserId === "string") {
        setUserId(currentUserId)
      } else {
        const resolvedId = await currentUserId
        setUserId(resolvedId)
      }
    }

    resolveUserId()
  }, [currentUserId])

  // Check if current user can delete this note
  const canDelete =
    isRoomCreator || // Room creator can delete any note
    userId === note.user_id ||
    (note.user_id.startsWith("guest-") && note.user_id.includes(userId)) ||
    (note.user_id.includes("-guest-") && userId === note.user_id.split("-guest-")[0])

  // Handle dragging
  useEffect(() => {
    if (!isDragging || isCompleted) return

    const handleMouseMove = (e: MouseEvent) => {
      const parentRect = noteRef.current?.parentElement?.getBoundingClientRect()
      if (!parentRect) return

      // Calculate new position as percentage of parent container
      const newX = ((e.clientX - parentRect.left - dragOffset.x) / parentRect.width) * 100
      const newY = ((e.clientY - parentRect.top - dragOffset.y) / parentRect.height) * 100

      // Constrain to parent boundaries
      const constrainedX = Math.max(0, Math.min(newX, 95))
      const constrainedY = Math.max(0, Math.min(newY, 95))

      setPosition({ x: constrainedX, y: constrainedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      onPositionChange(note.id, position.x, position.y)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset, note.id, onPositionChange, position.x, position.y, isCompleted])

  // Handle touch events for mobile
  useEffect(() => {
    if (!noteRef.current || isCompleted) return

    const element = noteRef.current

    const handleTouchStart = (e: TouchEvent) => {
      if (isCompleted) return

      const touch = e.touches[0]
      const rect = element.getBoundingClientRect()

      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      })
      setIsDragging(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      e.preventDefault()

      const touch = e.touches[0]
      const parentRect = element.parentElement?.getBoundingClientRect()
      if (!parentRect) return

      // Calculate new position as percentage of parent container
      const newX = ((touch.clientX - parentRect.left - dragOffset.x) / parentRect.width) * 100
      const newY = ((touch.clientY - parentRect.top - dragOffset.y) / parentRect.height) * 100

      // Constrain to parent boundaries
      const constrainedX = Math.max(0, Math.min(newX, 95))
      const constrainedY = Math.max(0, Math.min(newY, 95))

      setPosition({ x: constrainedX, y: constrainedY })
    }

    const handleTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false)
        onPositionChange(note.id, position.x, position.y)
      }
    }

    element.addEventListener("touchstart", handleTouchStart, { passive: false })
    element.addEventListener("touchmove", handleTouchMove, { passive: false })
    element.addEventListener("touchend", handleTouchEnd)

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchmove", handleTouchMove)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, dragOffset, note.id, onPositionChange, position.x, position.y, isCompleted])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isCompleted) return

    if (!noteRef.current) return

    const rect = noteRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  return (
    <div
      ref={noteRef}
      className={`absolute flex flex-col rounded-md border-2 border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow ${isCompleted ? "cursor-default" : "cursor-move"}`}
      style={{
        backgroundColor: note.color,
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: "200px",
        zIndex: isDragging ? 10 : 1,
        opacity: isCompleted ? 0.9 : 1,
      }}
      onMouseDown={!isCompleted ? handleMouseDown : undefined}
    >
      {canDelete && !isCompleted && (
        <button
          onClick={() => onDelete(note.id)}
          className="absolute right-1 top-1 rounded-full p-1 text-gray-700 hover:bg-black/10"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <p className="mb-4 text-sm">{note.content}</p>
      <div className="mt-auto flex items-center gap-2">
        <Avatar className="h-6 w-6 border border-black">
          <AvatarImage src={note.user.avatar_url || "/placeholder.svg?height=24&width=24"} />
          <AvatarFallback className="text-xs">{note.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium">
          {note.user.username}
          {note.user.isGuest && <span className="ml-1 text-gray-500">(Guest)</span>}
        </span>
      </div>
    </div>
  )
}

