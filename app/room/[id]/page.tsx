"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, ArrowLeft, Sparkles } from "lucide-react"
import RetroNote from "@/components/retro-note"
import AISummaryModal from "@/components/ai-summary-modal"
import { useNotification } from "@/components/notification-provider"

interface User {
  id: string
  username: string
  avatar_url?: string
  isGuest?: boolean
}

interface Note {
  id: string
  content: string
  color: string
  position_x: number
  position_y: number
  user_id: string
  room_id: string
  created_at: string
  user: User
}

export default function GuestRetroRoom() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const guestName = searchParams.get("guest")

  const [room, setRoom] = useState<any>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [showAISummary, setShowAISummary] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summary, setSummary] = useState("")

  const { showNotification } = useNotification()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const initUser = async () => {
      // Check if we have a guest user from URL parameter
      if (guestName) {
        const guestUser: User = {
          id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          username: guestName,
          isGuest: true,
        }
        setUser(guestUser)
        return guestUser
      }

      // Check if we have a guest user in localStorage
      const storedGuest = localStorage.getItem("guestUser")
      if (storedGuest) {
        const guestUser = JSON.parse(storedGuest)
        setUser(guestUser)
        return guestUser
      }

      // Otherwise, try to get authenticated user
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (authUser) {
          // Get user profile
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()

          if (profileData) {
            setUser(profileData)
            return profileData
          }
        }
      } catch (error) {
        console.error("Error getting authenticated user:", error)
      }

      // If we get here, redirect to join page
      router.push(`/join/${id}`)
      return null
    }

    const fetchRoomData = async () => {
      try {
        const currentUser = await initUser()
        if (!currentUser) return

        // Get room details
        const { data: roomData, error: roomError } = await supabase
          .from("retro_rooms")
          .select("*")
          .eq("id", id)
          .single()

        if (roomError) throw roomError
        setRoom(roomData)

        // Get notes
        const { data: notesData, error: notesError } = await supabase
          .from("retro_notes")
          .select(`
            *,
            user:user_id (
              id,
              username,
              avatar_url
            )
          `)
          .eq("room_id", id)
          .order("created_at", { ascending: true })

        if (notesError) throw notesError

        // For guest users, we need to handle notes differently
        const processedNotes = notesData.map((note: any) => {
          // If the note is from a guest user (user_id starts with "guest-")
          if (note.user_id.startsWith("guest-")) {
            // Try to reconstruct guest user info from the user_id
            const parts = note.user_id.split("-guest-")
            if (parts.length > 1) {
              return {
                ...note,
                user: {
                  id: note.user_id,
                  username: parts[1] || "Guest",
                  isGuest: true,
                },
              }
            }
          }
          return note
        })

        setNotes(processedNotes)

        // Add current user to active users
        setActiveUsers([currentUser])

        setLoading(false)
      } catch (error: any) {
        showNotification(error.message || "Failed to load room data", "error")
      }
    }

    fetchRoomData()

    // Set up real-time subscription for notes
    const notesSubscription = supabase
      .channel("public:retro_notes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "retro_notes",
          filter: `room_id=eq.${id}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // For guest users, we need to handle differently
            if (payload.new.user_id.startsWith("guest-")) {
              const parts = payload.new.user_id.split("-guest-")
              const guestUsername = parts.length > 1 ? parts[1] : "Guest"

              const newNote = {
                ...payload.new,
                user: {
                  id: payload.new.user_id,
                  username: guestUsername,
                  isGuest: true,
                },
              } as Note

              setNotes((prevNotes) => [...prevNotes, newNote])
            } else {
              // For regular users, fetch the user data
              const { data: userData } = await supabase
                .from("profiles")
                .select("id, username, avatar_url")
                .eq("id", payload.new.user_id)
                .single()

              const newNote = {
                ...payload.new,
                user: userData,
              } as Note

              setNotes((prevNotes) => [...prevNotes, newNote])
            }
          } else if (payload.eventType === "UPDATE") {
            setNotes((prevNotes) =>
              prevNotes.map((note) => (note.id === payload.new.id ? { ...note, ...payload.new } : note)),
            )
          } else if (payload.eventType === "DELETE") {
            setNotes((prevNotes) => prevNotes.filter((note) => note.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notesSubscription)
    }
  }, [id, supabase, router, guestName, showNotification])

  const addNote = async () => {
    if (!newNote.trim() || !user) return

    try {
      // Generate random position within the board
      const posX = Math.floor(Math.random() * 60) + 10 // 10-70% of width
      const posY = Math.floor(Math.random() * 60) + 10 // 10-70% of height

      // Generate random pastel color
      const colors = ["#FFD166", "#06D6A0", "#118AB2", "#EF476F", "#073B4C"]
      const color = colors[Math.floor(Math.random() * colors.length)]

      // For guest users, we'll use a special format for user_id
      const userId = user.isGuest ? `${user.id}-guest-${user.username}` : user.id

      await supabase.from("retro_notes").insert([
        {
          content: newNote,
          color,
          position_x: posX,
          position_y: posY,
          user_id: userId,
          room_id: id,
        },
      ])

      setNewNote("")
    } catch (error: any) {
      showNotification(error.message || "Failed to add note", "error")
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      await supabase.from("retro_notes").delete().eq("id", noteId)
    } catch (error: any) {
      showNotification(error.message || "Failed to delete note", "error")
    }
  }

  const updateNotePosition = async (noteId: string, posX: number, posY: number) => {
    try {
      await supabase
        .from("retro_notes")
        .update({
          position_x: posX,
          position_y: posY,
        })
        .eq("id", noteId)
    } catch (error: any) {
      console.error("Failed to update note position:", error)
    }
  }

  const generateAISummary = async () => {
    setSummaryLoading(true)
    setShowAISummary(true)

    try {
      // Prepare the data for the AI
      const notesByUser: Record<string, string[]> = {}

      notes.forEach((note) => {
        const username = note.user.username
        if (!notesByUser[username]) {
          notesByUser[username] = []
        }
        notesByUser[username].push(note.content)
      })

      // Call your AI API here
      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: notesByUser,
          roomName: room.name,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      const data = await response.json()
      setSummary(data.summary)
      showNotification("AI summary generated successfully!", "success")
    } catch (error: any) {
      showNotification(error.message || "Failed to generate AI summary", "error")
      // Show a fallback summary if the API fails
      setSummary("Failed to generate summary. Please try again later.")
    } finally {
      setSummaryLoading(false)
    }
  }

  const goBack = () => {
    if (user?.isGuest) {
      router.push("/")
    } else {
      router.push("/dashboard")
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goBack} className="border-2 border-black">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{room?.name}</h1>
            {room?.room_key && <p className="text-gray-500">Room Key: {room?.room_key}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={generateAISummary} className="bg-[#118AB2] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="mr-2 h-4 w-4" /> AI Summary
          </Button>
          <div className="flex -space-x-2">
            {activeUsers.map((user) => (
              <Avatar key={user.id} className="border-2 border-background">
                <AvatarImage src={user.avatar_url || "/placeholder.svg?height=40&width=40"} />
                <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>

      <Card className="relative mb-6 flex items-center gap-2 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Input
          placeholder="Add your thoughts..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
          className="border-2 border-black"
        />
        <Button onClick={addNote} className="bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Plus className="mr-2 h-4 w-4" /> Add Note
        </Button>
      </Card>

      <div className="relative h-[calc(100vh-250px)] overflow-hidden rounded-xl border-2 border-black bg-[#f8f9fa] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {notes.map((note) => (
          <RetroNote
            key={note.id}
            note={note}
            onDelete={deleteNote}
            onPositionChange={updateNotePosition}
            currentUserId={user?.id || ""}
          />
        ))}

        {notes.length === 0 && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-500">
            <p className="text-lg font-medium">No notes yet</p>
            <p>Add your first note to get started</p>
          </div>
        )}
      </div>

      <AISummaryModal
        isOpen={showAISummary}
        onClose={() => setShowAISummary(false)}
        loading={summaryLoading}
        summary={summary}
        roomName={room?.name || "Retrospective"}
      />
    </div>
  )
}

