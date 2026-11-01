-- ========================================================
-- Supabase Schema & Storage Fixes
-- Run this in your Supabase SQL Editor (https://app.supabase.com/)
-- ========================================================

-- 1. Enforce Foreign Key relationship between interview_results and Interviews
ALTER TABLE interview_results 
DROP CONSTRAINT IF EXISTS fk_interview_results_interview;

ALTER TABLE interview_results 
ADD CONSTRAINT fk_interview_results_interview 
FOREIGN KEY (interview_id) 
REFERENCES "Interviews"(interview_id) 
ON DELETE CASCADE;

-- 2. Create 'cv-uploads' storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Create 'avatars' storage bucket for user profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Enable public upload, read, update, delete on 'cv-uploads'
DROP POLICY IF EXISTS "Public cv-uploads access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to cv-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from cv-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates on cv-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes on cv-uploads" ON storage.objects;

CREATE POLICY "Allow public uploads to cv-uploads"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'cv-uploads');

CREATE POLICY "Allow public reads from cv-uploads"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'cv-uploads');

CREATE POLICY "Allow public updates on cv-uploads"
ON storage.objects FOR UPDATE TO public
USING (bucket_id = 'cv-uploads');

CREATE POLICY "Allow public deletes on cv-uploads"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'cv-uploads');

-- 5. Enable public upload, read, update, delete on 'avatars'
DROP POLICY IF EXISTS "Allow public uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes on avatars" ON storage.objects;

CREATE POLICY "Allow public uploads to avatars"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow public reads from avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Allow public updates on avatars"
ON storage.objects FOR UPDATE TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Allow public deletes on avatars"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'avatars');

-- 6. Add columns to store parsed CV details and score on users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS cv_parsed_data JSONB,
ADD COLUMN IF NOT EXISTS cv_score INTEGER,
ADD COLUMN IF NOT EXISTS cv_target_role TEXT;
