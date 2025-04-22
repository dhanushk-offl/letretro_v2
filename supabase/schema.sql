-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_pro column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;

-- Create retro rooms table
CREATE TABLE retro_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT FALSE,
  password TEXT,
  room_key TEXT NOT NULL UNIQUE,
  share_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT FALSE
);

-- Create room participants table
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES retro_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Create retro notes table
CREATE TABLE retro_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  color TEXT NOT NULL,
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  user_id TEXT NOT NULL, -- Changed to TEXT to support guest users
  room_id UUID NOT NULL REFERENCES retro_rooms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE retro_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE retro_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for retro rooms
CREATE POLICY "Anyone can view public rooms"
  ON retro_rooms FOR SELECT
  USING (NOT is_private OR owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM room_participants WHERE room_id = retro_rooms.id AND user_id = auth.uid()
  ));

CREATE POLICY "Room owners can update their rooms"
  ON retro_rooms FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Room owners can delete their rooms"
  ON retro_rooms FOR DELETE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create rooms"
  ON retro_rooms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for room participants
CREATE POLICY "Anyone can view room participants"
  ON room_participants FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can join rooms"
  ON room_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can leave rooms they joined"
  ON room_participants FOR DELETE
  USING (user_id = auth.uid());

-- Create policies for retro notes
CREATE POLICY "Anyone can view notes in a room"
  ON retro_notes FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can create notes"
  ON retro_notes FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Note creators can update their notes"
  ON retro_notes FOR UPDATE
  USING (user_id::text = auth.uid()::text OR user_id LIKE 'guest-%');

CREATE POLICY "Note creators can delete their notes"
  ON retro_notes FOR DELETE
  USING (user_id::text = auth.uid()::text OR user_id LIKE 'guest-%' OR EXISTS (
    SELECT 1 FROM retro_rooms WHERE id = retro_notes.room_id AND owner_id = auth.uid()
  ));

-- Create functions for real-time features
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE retro_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE retro_notes;

