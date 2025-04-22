import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, Users } from "lucide-react"

// Define the Profile type used in the component
interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
}

export default async function Dashboard() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get rooms created by the user
  const { data: createdRooms } = await supabase
    .from("retro_rooms")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  // Define the RetroRoom type
    interface RetroRoom {
      id: string;
      name: string;
      owner_id: string;
      created_at: string;
      is_private: boolean;
      room_key: string;
    }
  
    // Define the Participation type with proper typing for retro_rooms
    interface Participation {
      room_id: string;
      joined_at: string;
      retro_rooms: RetroRoom;
    }
  
    // Get rooms joined by the user (but not created by them)
    const { data: participations } = await supabase
      .from("room_participants")
      .select(`
        room_id,
        joined_at,
        retro_rooms (*)
      `)
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false }) as { data: Participation[] | null }

  // Filter out rooms that the user created (to avoid duplicates)
  const joinedRooms =
    participations
      ?.filter((p) => p.retro_rooms && typeof p.retro_rooms === 'object' && !Array.isArray(p.retro_rooms) && p.retro_rooms.owner_id !== user.id)
      .map((p) => p.retro_rooms)
      .filter(Boolean) || []

  // Get participants for each room
  const roomsWithParticipants = await Promise.all(
    [...(createdRooms || []), ...(joinedRooms || [])].map(async (room) => {
      const { data: participants } = await supabase
        .from("room_participants")
        .select(`
        user_id,
        profiles (id, username, avatar_url)
      `)
        .eq("room_id", room.id)
        .limit(6) // Get 6 to know if there are more than 5

      // Also get the count of all participants
      const { count } = await supabase
        .from("room_participants")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id)

      return {
        ...room,
        participants: participants?.map((p) => p.profiles) || [],
        participantCount: count || 0,
      }
    }),
  )

  // Separate back into created and joined rooms
  const createdRoomsWithParticipants = roomsWithParticipants.filter((room) => room.owner_id === user.id)
  const joinedRoomsWithParticipants = roomsWithParticipants.filter((room) => room.owner_id !== user.id)

  const allRooms = [...createdRoomsWithParticipants, ...joinedRoomsWithParticipants]

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Retro Rooms</h1>
        <Link href="/dashboard/create-room">
          <Button className="bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Plus className="mr-2 h-4 w-4" /> Create Room
          </Button>
        </Link>
      </div>

      {createdRoomsWithParticipants.length > 0 && (
        <>
          <h2 className="mb-4 text-xl font-semibold">Rooms You Created</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {createdRoomsWithParticipants.map((room) => (
              <Link key={room.id} href={`/dashboard/room/${room.id}`}>
                <Card className="h-full cursor-pointer border-2 border-black transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{room.name}</CardTitle>
                        <CardDescription>Created on {new Date(room.created_at).toLocaleDateString()}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-primary text-white border-black">
                        Owner
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{room.is_private ? "Private Room" : "Public Room"}</p>
                    <p className="text-sm text-gray-500 mb-4">Room Key: {room.room_key}</p>

                    <div className="flex items-center mt-2">
                      <div className="flex -space-x-2 mr-2">
                        {room.participants.slice(0, 5).map((participant: Profile, i: number) => (
                          <Avatar key={i} className="border-2 border-background h-8 w-8">
                          <AvatarImage src={participant.avatar_url || "/placeholder.svg?height=32&width=32"} />
                          <AvatarFallback>{participant.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {room.participantCount > 5 && (
                        <span className="text-sm text-gray-500">+{room.participantCount - 5} more</span>
                      )}
                      {room.participantCount === 0 && (
                        <span className="text-sm text-gray-500 flex items-center">
                          <Users className="h-4 w-4 mr-1" /> No participants yet
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {joinedRoomsWithParticipants.length > 0 && (
        <>
          <h2 className="mb-4 text-xl font-semibold">Rooms You Joined</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {joinedRoomsWithParticipants.map((room) => (
              <Link key={room.id} href={`/dashboard/room/${room.id}`}>
                <Card className="h-full cursor-pointer border-2 border-black transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{room.name}</CardTitle>
                        <CardDescription>Created on {new Date(room.created_at).toLocaleDateString()}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-[#118AB2] text-white border-black">
                        Joined
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{room.is_private ? "Private Room" : "Public Room"}</p>
                    <p className="text-sm text-gray-500 mb-4">Room Key: {room.room_key}</p>

                    <div className="flex items-center mt-2">
                      <div className="flex -space-x-2 mr-2">
                        {room.participants.slice(0, 5).map((participant: { 
                          id: string;
                          username?: string; 
                          avatar_url?: string;
                        }, i: number) => (
                          <Avatar key={i} className="border-2 border-background h-8 w-8">
                          <AvatarImage src={participant.avatar_url || "/placeholder.svg?height=32&width=32"} />
                          <AvatarFallback>{participant.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {room.participantCount > 5 && (
                        <span className="text-sm text-gray-500">+{room.participantCount - 5} more</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {allRooms.length === 0 && (
        <div className="col-span-full rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-medium">No retro rooms yet</h3>
          <p className="mt-2 text-gray-500">Create your first retro room to get started</p>
          <Link href="/dashboard/create-room" className="mt-4 inline-block">
            <Button className="bg-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Plus className="mr-2 h-4 w-4" /> Create Room
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Join a Room</h2>
        <Card className="border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="p-0">
            <Link href="/dashboard/join-room">
              <Button className="w-full bg-[#118AB2] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Join Existing Room
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

