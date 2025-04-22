"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function JoinRoom() {
  const [roomKey, setRoomKey] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [roomInfo, setRoomInfo] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleRoomKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase()

    // Format as XXX-XXX-XXX
    if (value.length > 0) {
      value = value.replace(/[^A-Z0-9-]/g, "")

      if (value.length > 3 && value.charAt(3) !== "-") {
        value = value.slice(0, 3) + "-" + value.slice(3)
      }
      if (value.length > 7 && value.charAt(7) !== "-") {
        value = value.slice(0, 7) + "-" + value.slice(7)
      }
      if (value.length > 11) {
        value = value.slice(0, 11)
      }
    }

    setRoomKey(value)
  }

  const findRoom = async () => {
    if (roomKey.length < 11) {
      toast({
        title: "Invalid room key",
        description: "Please enter a valid room key in the format XXX-XXX-XXX",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.from("retro_rooms").select("*").eq("room_key", roomKey).single()

      if (error) throw error

      setRoomInfo(data)

      if (!data.is_private) {
        // If room is not private, join immediately
        joinRoom(data.id)
      }
    } catch (error: any) {
      toast({
        title: "Room not found",
        description: "Please check the room key and try again",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const joinRoom = async (roomId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not authenticated")

      if (roomInfo && roomInfo.is_private) {
        // Verify password for private rooms
        if (password !== roomInfo.password) {
          toast({
            title: "Incorrect password",
            description: "The password you entered is incorrect",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      // Add user to room participants
      const { error } = await supabase.from("room_participants").insert([
        {
          room_id: roomId,
          user_id: user.id,
        },
      ])

      if (error && error.code !== "23505") {
        // Ignore duplicate participant error
        throw error
      }

      router.push(`/dashboard/room/${roomId}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!roomInfo) {
      findRoom()
    } else if (roomInfo.is_private) {
      joinRoom(roomInfo.id)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="mb-8 text-3xl font-bold">Join a Retro Room</h1>
      <Card className="mx-auto max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle>Enter Room Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-key">Room Key</Label>
              <Input
                id="room-key"
                placeholder="XXX-XXX-XXX"
                value={roomKey}
                onChange={handleRoomKeyChange}
                required
                className="border-2 border-black"
                disabled={roomInfo !== null}
              />
            </div>

            {roomInfo && roomInfo.is_private && (
              <div className="space-y-2">
                <Label htmlFor="password">Room Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-2 border-black"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              disabled={loading}
            >
              {loading ? (roomInfo ? "Joining..." : "Finding Room...") : roomInfo ? "Join Room" : "Find Room"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

