-- Uwezo Social Ideation Platform Database Schema
-- Execute this in your Supabase SQL Editor to create all necessary tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  location TEXT,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  ideas_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ideas table
CREATE TABLE IF NOT EXISTS ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes table (for ideas and comments)
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT likes_single_target CHECK (
    (idea_id IS NOT NULL AND comment_id IS NULL) OR
    (idea_id IS NULL AND comment_id IS NOT NULL)
  ),
  UNIQUE(user_id, idea_id),
  UNIQUE(user_id, comment_id)
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  category TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_id UUID, -- Can reference ideas, comments, users, etc.
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_ideas_author_id ON ideas(author_id);
CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideas(category);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_idea_id ON likes(idea_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies

-- Profiles: Users can view all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Ideas: Public ideas are viewable by everyone, users can manage their own
CREATE POLICY "Published ideas are viewable by everyone" ON ideas
  FOR SELECT USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "Users can insert their own ideas" ON ideas
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own ideas" ON ideas
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own ideas" ON ideas
  FOR DELETE USING (auth.uid() = author_id);

-- Comments: Users can view comments on published ideas, manage their own
CREATE POLICY "Comments are viewable for published ideas" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE ideas.id = comments.idea_id 
      AND (ideas.status = 'published' OR ideas.author_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- Likes: Users can view all likes, manage their own
CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON likes
  FOR ALL USING (auth.uid() = user_id);

-- Follows: Users can view all follows, manage their own
CREATE POLICY "Follows are viewable by everyone" ON follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON follows
  FOR ALL USING (auth.uid() = follower_id);

-- Achievements: Everyone can view achievements
CREATE POLICY "Achievements are viewable by everyone" ON achievements
  FOR SELECT USING (true);

-- User achievements: Users can view all, manage their own
CREATE POLICY "User achievements are viewable by everyone" ON user_achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);

-- Notifications: Users can only see their own
CREATE POLICY "Users can only see their own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Create some sample achievements
INSERT INTO achievements (name, description, icon, category, points) VALUES
  ('First Idea', 'Posted your first idea', '💡', 'creation', 10),
  ('Idea Master', 'Posted 10 ideas', '🚀', 'creation', 100),
  ('Social Butterfly', 'Followed 10 users', '👥', 'social', 50),
  ('Popular Creator', 'Got 100 likes on an idea', '⭐', 'engagement', 200),
  ('Helpful Commenter', 'Left 25 helpful comments', '💬', 'engagement', 75),
  ('Early Adopter', 'One of the first 100 users', '🏆', 'special', 500)
ON CONFLICT (name) DO NOTHING;

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Award "Early Adopter" achievement to first 100 users
  IF (SELECT COUNT(*) FROM profiles) <= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT NEW.id, id FROM achievements WHERE name = 'Early Adopter';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update counters
CREATE OR REPLACE FUNCTION update_idea_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update author's ideas count
    UPDATE profiles 
    SET ideas_count = ideas_count + 1 
    WHERE id = NEW.author_id;
    
    -- Award "First Idea" achievement
    IF NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = NEW.author_id AND a.name = 'First Idea'
    ) THEN
      INSERT INTO user_achievements (user_id, achievement_id)
      SELECT NEW.author_id, id FROM achievements WHERE name = 'First Idea';
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update author's ideas count
    UPDATE profiles 
    SET ideas_count = ideas_count - 1 
    WHERE id = OLD.author_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for idea stats
DROP TRIGGER IF EXISTS trigger_update_idea_stats ON ideas;
CREATE TRIGGER trigger_update_idea_stats
  AFTER INSERT OR DELETE ON ideas
  FOR EACH ROW EXECUTE FUNCTION update_idea_stats();