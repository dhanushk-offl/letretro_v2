"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function JoinWithToken() {
  const { token } = useParams()
  const [room, setRoom] = useState<any>(null)
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }

    const fetchRoomByToken = async () => {
      try {
        const { data, error } = await supabase.from("retro_rooms").select("*").eq("share_token", token).single()

        if (error) throw error
        setRoom(data)
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Invalid or expired link",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    fetchRoomByToken()
  }, [token, supabase, toast])

  const handleJoinAsGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoining(true)

    try {
      if (!username.trim()) {
        throw new Error("Please enter a username")
      }

      // Create a temporary guest user
      const guestId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      // Store guest info in local storage
      localStorage.setItem(
        "guestUser",
        JSON.stringify({
          id: guestId,
          username,
          isGuest: true,
        }),
      )

      // Redirect to the room
      router.push(`/room/${room.id}?guest=${encodeURIComponent(username)}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      })
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="container flex h-screen flex-col items-center justify-center">
        <Card className="mx-auto w-full max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle className="text-center">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">This link is invalid or has expired.</p>
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => router.push("/")}
                className="bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="container flex h-screen flex-col items-center justify-center">
        <Card className="mx-auto w-full max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle className="text-center">Join "{room.name}"</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">You're already logged in. Would you like to join this room?</p>
            <div className="flex flex-col gap-4">
              <Button
                onClick={() => router.push(`/dashboard/room/${room.id}`)}
                className="w-full bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Join Room
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex h-screen flex-col items-center justify-center">
      <Card className="mx-auto w-full max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle className="text-center">Join "{room.name}"</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-md">
            <p className="text-amber-800 text-sm">
              For the best experience, we recommend{" "}
              <Link href="/login" className="underline font-semibold">
                logging in
              </Link>{" "}
              or{" "}
              <Link href="/signup" className="underline font-semibold">
                creating an account
              </Link>{" "}
              before joining.
            </p>
          </div>

          <form onSubmit={handleJoinAsGuest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Your Name</Label>
              <Input
                id="username"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-2 border-black"
              />
              <p className="text-xs text-gray-500">This name will be displayed on your notes</p>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              disabled={joining}
            >
              {joining ? "Joining..." : "Join as Guest"}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link href={`/login?redirect=/join/${token}`} className="underline">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

