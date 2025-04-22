"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNotification } from "@/components/notification-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isCorporateEmail, setIsCorporateEmail] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [isPro, setIsPro] = useState(false)
  const router = useRouter()
  const { showNotification } = useNotification()
  const supabase = createClientComponentClient()

  // List of corporate email domains
  const corporateDomains = [
    "company.com",
    "enterprise.org",
    "corp.net",
    // Add more corporate domains as needed
  ]

  useEffect(() => {
    // Check if username is available when it changes
    const checkUsername = async () => {
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
  }, [username, supabase])

  useEffect(() => {
    // Check if email is a corporate email
    if (email) {
      const domain = email.split("@")[1]
      setIsCorporateEmail(corporateDomains.includes(domain))
    } else {
      setIsCorporateEmail(false)
    }
  }, [email])

  const validatePromoCode = (code: string) => {
    // List of valid promo codes
    const validPromoCodes = ["PROUSER2025", "LETRETROPRO", "EARLYBIRD"]
    return validPromoCodes.includes(code)
  }

  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value
    setPromoCode(code)
    setIsPro(validatePromoCode(code))
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (username.length < 3) {
        throw new Error("Username must be at least 3 characters long")
      }

      if (!usernameAvailable) {
        throw new Error("Username is already taken")
      }

      // For email/password signup, only allow corporate emails
      if (
        !isCorporateEmail &&
        !email.endsWith("gmail.com") &&
        !email.endsWith("outlook.com") &&
        !email.endsWith("hotmail.com")
      ) {
        throw new Error("Please use a corporate email address or common email provider")
      }

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            is_pro: isPro,
          },
        },
      })

      if (error) {
        throw error
      }

      // Create user profile in profiles table
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            username,
            email,
            is_pro: isPro,
            created_at: new Date().toISOString(),
          },
        ])

        if (profileError) {
          throw profileError
        }
      }

      showNotification("Account created! Please check your email to confirm your account.", "success")
      router.push("/login")
    } catch (error: any) {
      showNotification(error.message || "Something went wrong", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignUp = async (provider: "google" | "azure") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      showNotification(error.message || "Failed to sign in", "error")
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="container flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Create an account</h1>
            <p className="text-gray-500">Choose how you'd like to sign up</p>
          </div>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="social">Social Login</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="johndoe"
                      required
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

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="name@example.com"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-2 border-black"
                    />
                    {isCorporateEmail && <p className="text-xs text-green-500">Corporate email detected</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-2 border-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promo-code">Promo Code (Optional)</Label>
                    <Input
                      id="promo-code"
                      placeholder="Enter promo code for PRO access"
                      value={promoCode}
                      onChange={handlePromoCodeChange}
                      className={`border-2 ${isPro ? "border-green-500" : "border-black"}`}
                    />
                    {isPro && <p className="text-xs text-green-500">Valid promo code! You'll be upgraded to PRO.</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="social">
              <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 border-black font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center"
                    onClick={() => handleSocialSignUp("google")}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign up with Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 border-black font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center"
                    onClick={() => handleSocialSignUp("azure")}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
                      <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                      <path fill="#f35325" d="M1 1h10v10H1z" />
                      <path fill="#81bc06" d="M12 1h10v10H12z" />
                      <path fill="#05a6f0" d="M1 12h10v10H1z" />
                      <path fill="#ffba08" d="M12 12h10v10H12z" />
                    </svg>
                    Sign up with Microsoft
                  </Button>

                  <Alert className="bg-blue-50 border-blue-200">
                    <Mail className="h-4 w-4 text-blue-800" />
                    <AlertDescription className="text-blue-800">
                      Corporate users: Please use your corporate email to sign up.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

