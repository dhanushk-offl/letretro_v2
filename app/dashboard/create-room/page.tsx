"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useNotification } from "@/components/notification-provider"
import { Copy, LinkIcon, AlertCircle, Crown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function CreateRoom() {
  const [name, setName] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [createdRoom, setCreatedRoom] = useState<any>(null)
  const [shareableLink, setShareableLink] = useState("")
  const [isPro, setIsPro] = useState(false)
  const [roomCount, setRoomCount] = useState(0)
  const [isLoadingUserData, setIsLoadingUserData] = useState(true)
  const router = useRouter()
  const { showNotification } = useNotification()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        // Get user profile to check if they're a pro user
        const { data: profile } = await supabase.from("profiles").select("is_pro").eq("id", user.id).single()

        setIsPro(profile?.is_pro || false)

        // Count how many rooms the user has created
        const { data: rooms, count } = await supabase
          .from("retro_rooms")
          .select("id", { count: "exact" })
          .eq("owner_id", user.id)

        setRoomCount(count || 0)
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setIsLoadingUserData(false)
      }
    }

    fetchUserData()
  }, [supabase, router])

  const generateRoomKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 9; i++) {
      if (i === 3 || i === 6) {
        result += "-"
      }
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const generateShareableToken = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if free user has reached room limit
    if (!isPro && roomCount >= 5) {
      showNotification(
        "You've reached the maximum number of rooms for free users. Upgrade to PRO for unlimited rooms.",
        "error",
      )
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not authenticated")

      const roomKey = generateRoomKey()
      const shareToken = generateShareableToken()

      const { data, error } = await supabase
        .from("retro_rooms")
        .insert([
          {
            name,
            owner_id: user.id,
            is_private: isPrivate,
            password: isPrivate ? password : null,
            room_key: roomKey,
            share_token: shareToken,
            is_completed: false,
          },
        ])
        .select()

      if (error) throw error

      // Generate shareable link
      const baseUrl = window.location.origin
      const link = `${baseUrl}/join/${shareToken}`
      setShareableLink(link)
      setCreatedRoom(data[0])

      // Update room count
      setRoomCount((prevCount) => prevCount + 1)

      showNotification(`Room created! Your room key is ${roomKey}`, "success")
    } catch (error: any) {
      showNotification(error.message || "Failed to create room", "error")
      setLoading(false)
    }
  }

  const copyShareableLink = () => {
    navigator.clipboard.writeText(shareableLink)
    showNotification("Shareable link copied to clipboard", "success")
  }

  const goToRoom = () => {
    router.push(`/dashboard/room/${createdRoom.id}`)
  }

  if (isLoadingUserData) {
    return (
      <div className="container py-10 flex justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="mb-8 text-3xl font-bold">Create a New Retro Room</h1>

      {!isPro && roomCount >= 5 && !createdRoom && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-800" />
          <AlertDescription className="text-amber-800">
            You've reached the maximum of 5 rooms for free users.
            <Link href="/dashboard/profile" className="ml-1 font-semibold underline">
              Upgrade to PRO
            </Link>{" "}
            for unlimited rooms.
          </AlertDescription>
        </Alert>
      )}

      {!isPro && roomCount < 5 && !createdRoom && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-800" />
          <AlertDescription className="text-blue-800">
            Free plan: {5 - roomCount} room{5 - roomCount !== 1 ? "s" : ""} remaining.
            <Link href="/dashboard/profile" className="ml-1 font-semibold underline">
              Upgrade to PRO
            </Link>{" "}
            for unlimited rooms.
          </AlertDescription>
        </Alert>
      )}

      {isPro && !createdRoom && (
        <Alert className="mb-6 bg-[#FFD166]/20 border-[#FFD166]">
          <Crown className="h-4 w-4 text-[#FFD166]" />
          <AlertDescription className="text-gray-800">
            PRO user: You can create unlimited retro rooms. Enjoy!
          </AlertDescription>
        </Alert>
      )}

      {!createdRoom ? (
        <Card className="mx-auto max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle>Room Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-2 border-black"
                  disabled={!isPro && roomCount >= 5}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-private"
                  checked={isPrivate}
                  onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
                  disabled={!isPro && roomCount >= 5}
                />
                <Label htmlFor="is-private">Make this room private</Label>
              </div>
              {isPrivate && (
                <div className="space-y-2">
                  <Label htmlFor="password">Room Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={isPrivate}
                    className="border-2 border-black"
                    disabled={!isPro && roomCount >= 5}
                  />
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                disabled={loading || (!isPro && roomCount >= 5)}
              >
                {loading ? "Creating..." : "Create Room"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="mx-auto max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle>Room Created Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block">Room Name</Label>
              <p className="rounded-md border-2 border-black bg-gray-50 p-2">{createdRoom.name}</p>
            </div>

            <div>
              <Label className="mb-2 block">Room Key</Label>
              <p className="rounded-md border-2 border-black bg-gray-50 p-2 font-mono">{createdRoom.room_key}</p>
            </div>

            <div>
              <Label className="mb-2 block">Shareable Link</Label>
              <div className="flex items-center gap-2">
                <Input value={shareableLink} readOnly className="border-2 border-black font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyShareableLink} className="border-2 border-black">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Share this link to allow others to join without authentication
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={goToRoom} className="flex-1 bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Go to Room
              </Button>
              <Button
                variant="outline"
                onClick={copyShareableLink}
                className="flex-1 border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

