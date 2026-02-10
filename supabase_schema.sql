
-- 1. Safely add 'created_by' column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_rooms' AND column_name = 'created_by') THEN
        ALTER TABLE public.chat_rooms ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Helper function to check membership (Security Definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_chat_member(_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.chat_participants 
    WHERE room_id = _room_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reset and Re-apply Chat Room Policies
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "create_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "view_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "update_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view own rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON public.chat_rooms;

-- Policy: Allow creation if you claim ownership (created_by = your_id)
CREATE POLICY "create_rooms" ON public.chat_rooms FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = created_by);

-- Policy: Allow viewing if you are the creator OR a member
CREATE POLICY "view_rooms" ON public.chat_rooms FOR SELECT TO authenticated 
USING (
  auth.uid() = created_by OR public.is_chat_member(id)
);

-- 4. Reset and Re-apply Participant Policies
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "view_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can insert participants" ON public.chat_participants;

-- Policy: Allow inserting participants (open for chat creation flow)
CREATE POLICY "insert_participants" ON public.chat_participants FOR INSERT TO authenticated WITH CHECK (true);

-- Policy: View participants if you are in the room
CREATE POLICY "view_participants" ON public.chat_participants FOR SELECT TO authenticated USING (
  public.is_chat_member(room_id)
);

-- 5. Reset and Re-apply Message Policies
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "view_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;

CREATE POLICY "view_messages" ON public.chat_messages FOR SELECT TO authenticated USING (
  public.is_chat_member(room_id)
);

CREATE POLICY "insert_messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  public.is_chat_member(room_id)
);

-- 6. Helper for Private Chat Lookup
CREATE OR REPLACE FUNCTION public.get_private_chat(uid1 UUID, uid2 UUID)
RETURNS SETOF public.chat_rooms AS $$
BEGIN
    RETURN QUERY
    SELECT r.*
    FROM public.chat_rooms r
    JOIN public.chat_participants p1 ON r.id = p1.room_id
    JOIN public.chat_participants p2 ON r.id = p2.room_id
    WHERE r.is_group = false
    AND p1.user_id = uid1
    AND p2.user_id = uid2
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. STORAGE BUCKET SETUP (For Voice/Image/File)
-- Create 'chat-assets' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-assets', 'chat-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to chat assets
-- We use DO blocks to avoid errors if policy already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'chat-assets' );
    END IF;
END $$;

-- Policy: Allow authenticated users to upload to chat assets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Upload'
    ) THEN
        CREATE POLICY "Authenticated Upload"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK ( bucket_id = 'chat-assets' );
    END IF;
END $$;
