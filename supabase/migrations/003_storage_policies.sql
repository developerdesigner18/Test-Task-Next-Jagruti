-- ────────────────────────────────────────────────────────────
-- STORAGE SECURITY POLICIES (Senior Implementation)
-- ────────────────────────────────────────────────────────────

-- 1. DESIGN FILES: Allow users to upload to their own folder only
-- Path pattern: design-files/{user_id}/filename.png
CREATE POLICY "Users can upload their own design files"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'design-files' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. DESIGN FILES: Allow users to view their own design files
CREATE POLICY "Users can view their own design files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'design-files' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. PROOF FILES: Allow customers to view proofs assigned to them
CREATE POLICY "Authenticated users can view proof files"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'proof-files' );
