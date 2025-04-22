"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Crown, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [username, setUsername] = useState("")
  const [originalUsername, setOriginalUsername] = useState("")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error("User not authenticated")

        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) throw error

        setProfile(data)
        setUsername(data.username || "")
        setOriginalUsername(data.username || "")
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load profile",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [supabase, toast])

  useEffect(() => {
    // Check if username is available when it changes
    const checkUsername = async () => {
      // Skip check if username hasn't changed
      if (username === originalUsername) {
        setUsernameAvailable(null)
        return
      }

      if (username.length < 3) {
        setUsernameAvailable(null)
        return
      }

      setIsCheckingUsername(true)
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", username)
          .maybeSingle()

        if (error) throw error

        setUsernameAvailable(data === null)
      } catch (error) {
        console.error("Error checking username:", error)
      } finally {
        setIsCheckingUsername(false)
      }
    }

    const timeoutId = setTimeout(checkUsername, 500)
    return () => clearTimeout(timeoutId)
  }, [username, originalUsername, supabase])

  const validatePromoCode = (code: string) => {
    // List of valid promo codes
    const validPromoCodes = ["PROUSER2023", "LETRETROPRO", "EARLYBIRD"]
    return validPromoCodes.includes(code)
  }

  const handlePromoCodeSubmit = async () => {
    if (!validatePromoCode(promoCode)) {
      toast({
        title: "Invalid promo code",
        description: "Please enter a valid promo code",
        variant: "destructive",
      })
      return
    }

    setUpdating(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_pro: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      setProfile({
        ...profile,
        is_pro: true,
      })

      toast({
        title: "Upgraded to PRO!",
        description: "You now have access to all PRO features",
      })

      setPromoCode("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upgrade account",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const updateProfile = async () => {
    if (username !== originalUsername && !usernameAvailable) {
      toast({
        title: "Username unavailable",
        description: "Please choose a different username",
        variant: "destructive",
      })
      return
    }

    setUpdating(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      setProfile({
        ...profile,
        username,
      })

      setOriginalUsername(username)

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
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
    <div className="container py-10">
      <h1 className="mb-8 text-3xl font-bold">Your Profile</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              {profile.is_pro && (
                <Badge className="bg-[#FFD166] text-black border-black flex items-center gap-1 px-3 py-1">
                  <Crown className="h-4 w-4" /> PRO
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24 border-2 border-black">
                <AvatarImage src={profile.avatar_url || "/placeholder.svg?height=96&width=96"} />
                <AvatarFallback className="text-2xl">{username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-bold">{username}</h2>
                <p className="text-gray-500">{profile.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`border-2 ${
                  usernameAvailable === false
                    ? "border-red-500"
                    : usernameAvailable === true
                      ? "border-green-500"
                      : "border-black"
                }`}
              />
              {isCheckingUsername && <p className="text-xs text-gray-500">Checking username...</p>}
              {usernameAvailable === false && <p className="text-xs text-red-500">Username is already taken</p>}
              {usernameAvailable === true && <p className="text-xs text-green-500">Username is available</p>}
            </div>
            <Button
              onClick={updateProfile}
              className="w-full bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              disabled={updating || (username !== originalUsername && !usernameAvailable)}
            >
              {updating ? "Updating..." : "Update Profile"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled className="border-2 border-black bg-gray-100" />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  onClick={() => {
                    supabase.auth.signOut()
                    window.location.href = "/"
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.is_pro ? (
                <div className="space-y-4">
                  <Alert className="bg-[#FFD166] border-[#FFD166]/50">
                    <Crown className="h-4 w-4 text-black" />
                    <AlertDescription className="text-black">
                      You are a PRO user! Enjoy unlimited rooms and all premium features.
                    </AlertDescription>
                  </Alert>
                  <div className="rounded-lg bg-gray-100 p-4">
                    <h3 className="font-bold">PRO Benefits:</h3>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Unlimited retro rooms</li>
                      <li>• Advanced AI summaries</li>
                      <li>• Priority support</li>
                      <li>• Custom templates</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-gray-100 border-gray-200">
                    <AlertCircle className="h-4 w-4 text-gray-800" />
                    <AlertDescription className="text-gray-800">
                      You are currently on the FREE plan. Upgrade to PRO for unlimited rooms and more features.
                    </AlertDescription>
                  </Alert>

                  <div className="rounded-lg bg-gray-100 p-4">
                    <h3 className="font-bold">FREE Plan Limits:</h3>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Maximum of 5 retro rooms</li>
                      <li>• Basic features only</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promo-code">Promo Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="promo-code"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="border-2 border-black"
                      />
                      <Button
                        onClick={handlePromoCodeSubmit}
                        className="bg-[#FFD166] text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        disabled={updating}
                      >
                        Upgrade
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Enter a valid promo code to upgrade to PRO</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

