import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Zap, Lock } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tighter">letRetro</span>
          </Link>
          <nav className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  Make your team retrospectives more effective
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  letRetro helps teams collaborate, reflect, and improve with interactive retrospective boards.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/signup">
                    <Button className="bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-transform">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="rounded-xl border-2 border-black bg-[#FFD166] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-float">
                  <div className="relative overflow-hidden rounded-lg border-2 border-black">
                    <img
                      alt="Retrospective board example"
                      className="aspect-video overflow-hidden rounded-lg object-cover object-center"
                      src="/placeholder.svg?height=400&width=600"
                    />
                    <div className="absolute -right-6 -top-6 rotate-12 rounded-lg bg-[#EF476F] px-8 py-2 text-white font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse-slow">
                      New AI Summary!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Animated Story Section */}
        <section className="w-full bg-[#118AB2] py-16 text-white overflow-hidden">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-8 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Our Story</h2>
              <div className="relative mb-12 overflow-hidden rounded-xl border-2 border-black bg-white p-1">
                <div className="flex animate-scroll space-x-4 py-4">
                  <div className="flex-none w-64 rounded-lg bg-[#FFD166] p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-2">
                    <h3 className="text-lg font-bold text-black">Identify Issues</h3>
                    <p className="text-black">Team members share what went wrong</p>
                  </div>
                  <div className="flex-none w-64 rounded-lg bg-[#06D6A0] p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-2">
                    <h3 className="text-lg font-bold text-black">Celebrate Wins</h3>
                    <p className="text-black">Recognize what went well</p>
                  </div>
                  <div className="flex-none w-64 rounded-lg bg-[#EF476F] p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-2">
                    <h3 className="text-lg font-bold text-black">Plan Actions</h3>
                    <p className="text-black">Decide what to improve</p>
                  </div>
                  <div className="flex-none w-64 rounded-lg bg-[#118AB2] p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-2">
                    <h3 className="text-lg font-bold text-white">AI Summary</h3>
                    <p className="text-white">Get insights from your retro</p>
                  </div>
                  {/* Duplicate cards for infinite scroll effect */}
                  <div className="flex-none w-64 rounded-lg bg-[#FFD166] p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-2">
                    <h3 className="text-lg font-bold text-black">Identify Issues</h3>
                    <p className="text-black">Team members share what went wrong</p>
                  </div>
                  <div className="flex-none w-64 rounded-lg bg-[#06D6A0] p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-2">
                    <h3 className="text-lg font-bold text-black">Celebrate Wins</h3>
                    <p className="text-black">Recognize what went well</p>
                  </div>
                  <div className="flex-none w-64 rounded-lg bg-[#EF476F] p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-2">
                    <h3 className="text-lg font-bold text-black">Plan Actions</h3>
                    <p className="text-black">Decide what to improve</p>
                  </div>
                  <div className="flex-none w-64 rounded-lg bg-[#118AB2] p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-2">
                    <h3 className="text-lg font-bold text-white">AI Summary</h3>
                    <p className="text-white">Get insights from your retro</p>
                  </div>
                </div>
              </div>
              <p className="text-xl">
                letRetro was born from our passion for agile methodologies and team improvement. We believe that
                effective retrospectives are the key to continuous growth and team success.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full bg-muted py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Features</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need for productive retrospectives
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border-2 border-black bg-[#06D6A0] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-2 duration-300">
                <CheckCircle className="h-12 w-12" />
                <h3 className="mt-4 text-xl font-bold">Real-time Collaboration</h3>
                <p className="mt-2 text-gray-600">
                  Work together with your team in real-time, see changes as they happen.
                </p>
              </div>
              <div className="rounded-xl border-2 border-black bg-[#118AB2] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-2 duration-300">
                <Lock className="h-12 w-12 text-white" />
                <h3 className="mt-4 text-xl font-bold text-white">Private Rooms</h3>
                <p className="mt-2 text-white">
                  Create password-protected rooms for your team's confidential discussions.
                </p>
              </div>
              <div className="rounded-xl border-2 border-black bg-[#EF476F] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-2 duration-300">
                <Zap className="h-12 w-12 text-white" />
                <h3 className="mt-4 text-xl font-bold text-white">AI Summary</h3>
                <p className="mt-2 text-white">Get AI-powered insights from your retrospective notes with one click.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Pricing Plans</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Choose the plan that fits your team's needs
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-3">
              {/* Free Plan */}
              <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-2 duration-300">
                <h3 className="text-2xl font-bold">Free</h3>
                <div className="mt-4 text-4xl font-bold">$0</div>
                <p className="mt-1 text-gray-500">Forever</p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    <span>Up to 3 retro rooms</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    <span>Basic templates</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    <span>5 participants per room</span>
                  </li>
                </ul>
                <Link href="/signup" className="mt-6 block">
                  <Button className="w-full bg-black text-white font-bold shadow-[4px_4px_0px_0px_rgba(239,71,111,1)] hover:translate-y-[-2px] transition-transform">
                    Get Started
                  </Button>
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="relative rounded-xl border-2 border-black bg-[#FFD166] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-2 duration-300">
                <div className="absolute -right-2 -top-2 rounded-full bg-[#EF476F] px-3 py-1 text-sm font-bold text-white border-2 border-black animate-pulse-slow">
                  Popular
                </div>
                <h3 className="text-2xl font-bold">Pro</h3>
                <div className="mt-4 text-4xl font-bold">$12</div>
                <p className="mt-1 text-gray-700">per user / month</p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    <span>Unlimited retro rooms</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    <span>Advanced templates</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    <span>20 participants per room</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    <span>AI summary feature</span>
                  </li>
                </ul>
                <Link href="/signup" className="mt-6 block">
                  <Button className="w-full bg-black text-white font-bold shadow-[4px_4px_0px_0px_rgba(239,71,111,1)] hover:translate-y-[-2px] transition-transform">
                    Start Free Trial
                  </Button>
                </Link>
              </div>

              {/* Corporate Plan */}
              <div className="rounded-xl border-2 border-black bg-[#118AB2] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-2 duration-300">
                <h3 className="text-2xl font-bold text-white">Corporate</h3>
                <div className="mt-4 text-4xl font-bold text-white">Custom</div>
                <p className="mt-1 text-white">tailored for your needs</p>
                <ul className="mt-6 space-y-2 text-white">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    <span>Enterprise-grade security</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    <span>SSO integration</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    <span>Unlimited participants</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    <span>Dedicated support</span>
                  </li>
                </ul>
                <Link href="/contact" className="mt-6 block">
                  <Button className="w-full bg-white text-[#118AB2] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-transform">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-background">
        <div className="container flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between md:py-12">
          <div className="flex flex-col gap-4 md:gap-2">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              letRetro
            </Link>
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} letRetro. All rights reserved.</p>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link href="#" className="underline-offset-4 hover:underline">
              Terms
            </Link>
            <Link href="#" className="underline-offset-4 hover:underline">
              Privacy
            </Link>
            <Link href="#" className="underline-offset-4 hover:underline">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

