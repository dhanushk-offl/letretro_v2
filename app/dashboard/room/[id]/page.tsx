"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Sparkles, Lock, AlertCircle } from "lucide-react"
import RetroNote from "@/components/retro-note"
import AISummaryModal from "@/components/ai-summary-modal"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface User {
  id: string
  username: string
  avatar_url?: string
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

interface Room {
  id: string
  name: string
  room_key: string
  owner_id: string
  is_completed: boolean
}

export default function RetroRoom() {
  const { id } = useParams()
  const [room, setRoom] = useState<any>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [isRoomCreator, setIsRoomCreator] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showAISummary, setShowAISummary] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summary, setSummary] = useState("")
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          toast({
            title: "Authentication Error",
            description: "You must be logged in to view this room",
            variant: "destructive",
          })
          return
        }

        setCurrentUserId(user.id)

        // Get room details
        const { data: roomData, error: roomError } = await supabase
          .from("retro_rooms")
          .select("*")
          .eq("id", id)
          .single()

        if (roomError) throw roomError
        setRoom(roomData)

        // Check if current user is the room creator
        setIsRoomCreator(roomData.owner_id === user.id)

        // Set completed state
        setIsCompleted(roomData.is_completed || false)

        // Get notes - fixed query to match your schema
        const { data: notesData, error: notesError } = await supabase
          .from("retro_notes")
          .select("*")
          .eq("room_id", id)
          .order("created_at", { ascending: true })

        if (notesError) throw notesError

        // Process notes to handle user data
        const processedNotes = await Promise.all(
          notesData.map(async (note: any) => {
            // If the note is from a guest user (user_id contains "-guest-")
            if (note.user_id.includes("-guest-")) {
              const parts = note.user_id.split("-guest-")
              return {
                ...note,
                user: {
                  id: note.user_id,
                  username: parts[1] || "Guest",
                  isGuest: true,
                },
              }
            } else {
              // For regular users, fetch the user data from profiles
              const { data: userData } = await supabase
                .from("profiles")
                .select("id, username, avatar_url")
                .eq("id", note.auth_user_id)
                .single()

              return {
                ...note,
                user: userData || {
                  id: note.user_id,
                  username: "Unknown User",
                  avatar_url: null,
                },
              }
            }
          })
        )

        setNotes(processedNotes)

        // Get active users
        const { data: usersData, error: usersError } = await supabase
          .from("room_participants")
          .select(`
            user:user_id (
              id,
              username,
              avatar_url
            )
          `)
          .eq("room_id", id)

        if (usersError) throw usersError
        setActiveUsers(usersData.map((item: any) => item.user))

        setLoading(false)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load room data",
          variant: "destructive",
        })
      }
    }

    fetchRoomData()

    // Set up real-time subscription for notes
    const notesSubscription = supabase
      .channel("retro_notes_changes")
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
            // Handle guest users
            if (payload.new.user_id.includes("-guest-")) {
              const parts = payload.new.user_id.split("-guest-")
              const guestUsername = parts.length > 1 ? parts[1] : "Guest"

              const newNote = {
                id: payload.new.id,
                content: payload.new.content,
                color: payload.new.color,
                position_x: payload.new.position_x,
                position_y: payload.new.position_y,
                user_id: payload.new.user_id,
                room_id: payload.new.room_id,
                created_at: payload.new.created_at,
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
                .eq("id", payload.new.auth_user_id)
                .single()

              const newNote = {
                ...payload.new,
                user: userData || {
                  id: payload.new.user_id,
                  username: "Unknown User",
                  avatar_url: null,
                },
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

    // Set up real-time subscription for participants
    const participantsSubscription = supabase
      .channel("room_participants_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_participants",
          filter: `room_id=eq.${id}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // Fetch the user data for the new participant
            const { data: userData } = await supabase
              .from("profiles")
              .select("id, username, avatar_url")
              .eq("id", payload.new.user_id)
              .single()

            setActiveUsers((prevUsers) => {
              if (userData && !prevUsers.find((user) => user.id === userData.id)) {
                return [...prevUsers, userData as User]
              }
              return prevUsers
            })
          } else if (payload.eventType === "DELETE") {
            setActiveUsers((prevUsers) => prevUsers.filter((user) => user.id !== payload.old.user_id))
          }
        },
      )
      .subscribe()

    // Set up real-time subscription for room updates
    const roomSubscription = supabase
      .channel("room_updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "retro_rooms",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setIsCompleted(payload.new.is_completed || false)
            setRoom((prev: Room | null) => prev ? { ...prev, ...payload.new } : null)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notesSubscription)
      supabase.removeChannel(participantsSubscription)
      supabase.removeChannel(roomSubscription)
    }
  }, [id, supabase, toast])

  const toggleRoomCompletion = async () => {
    try {
      const newCompletedState = !isCompleted

      const { error } = await supabase.from("retro_rooms").update({ is_completed: newCompletedState }).eq("id", id)

      if (error) throw error

      setIsCompleted(newCompletedState)
      toast({
        title: newCompletedState ? "Retrospective Completed" : "Retrospective Reopened",
        description: newCompletedState
          ? "Notes can no longer be added or modified"
          : "Notes can now be added and modified",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update room status",
        variant: "destructive",
      })
    }
  }

  const addNote = async () => {
    if (!newNote.trim() || isCompleted) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not authenticated")

      // Generate random position within the board
      const posX = Math.floor(Math.random() * 60) + 10 // 10-70% of width
      const posY = Math.floor(Math.random() * 60) + 10 // 10-70% of height

      // Generate random pastel color
      const colors = ["#FFD166", "#06D6A0", "#118AB2", "#EF476F", "#073B4C"]
      const color = colors[Math.floor(Math.random() * colors.length)]

      await supabase.from("retro_notes").insert([
        {
          content: newNote,
          color,
          position_x: posX,
          position_y: posY,
          user_id: user.id,
          room_id: id,
        },
      ])

      setNewNote("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add note",
        variant: "destructive",
      })
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      await supabase.from("retro_notes").delete().eq("id", noteId)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note",
        variant: "destructive",
      })
    }
  }

  const updateNotePosition = async (noteId: string, posX: number, posY: number) => {
    if (isCompleted) return

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
      toast({
        title: "Success",
        description: "AI summary generated successfully!",
        variant: "default",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI summary",
        variant: "destructive",
      })
      // Show a fallback summary if the API fails
      setSummary("Failed to generate summary. Please try again later.")
    } finally {
      setSummaryLoading(false)
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
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{room?.name}</h1>
          <p className="text-gray-500">Room Key: {room?.room_key}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {isRoomCreator && (
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md border">
              <Switch id="completed" checked={isCompleted} onCheckedChange={toggleRoomCompletion} />
              <Label htmlFor="completed" className="font-medium">
                Retrospective Completed
              </Label>
            </div>
          )}

          <Button onClick={generateAISummary} className="bg-[#118AB2] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="mr-2 h-4 w-4" /> AI Summary
          </Button>

          <div className="flex -space-x-2">
            {activeUsers.slice(0, 5).map((user) => (
              <Avatar key={user.id} className="border-2 border-background">
                <AvatarImage src={user.avatar_url || "/placeholder.svg?height=40&width=40"} />
                <AvatarFallback>{user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
            {activeUsers.length > 5 && (
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-200 border-2 border-background text-xs font-medium">
                +{activeUsers.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {isCompleted && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-800" />
          <AlertDescription className="text-amber-800">
            This retrospective has been marked as completed. Notes can no longer be added or modified.
          </AlertDescription>
        </Alert>
      )}

      <Card className="relative mb-6 flex items-center gap-2 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Input
          placeholder={isCompleted ? "Retrospective is completed - notes cannot be added" : "Add your thoughts..."}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isCompleted && addNote()}
          className="border-2 border-black"
          disabled={isCompleted}
        />
        <Button
          onClick={addNote}
          className="bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          disabled={isCompleted}
        >
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
            currentUserId={currentUserId}
            isRoomCreator={isRoomCreator}
            isCompleted={isCompleted}
          />
        ))}

        {notes.length === 0 && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-500">
            <p className="text-lg font-medium">No notes yet</p>
            <p>Add your first note to get started</p>
          </div>
        )}

        {isCompleted && (
          <div className="absolute inset-0 bg-black/5 pointer-events-none flex items-center justify-center">
            <Badge className="bg-amber-500 text-white text-lg py-2 px-4 pointer-events-none">
              <Lock className="mr-2 h-4 w-4" /> Retrospective Completed
            </Badge>
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