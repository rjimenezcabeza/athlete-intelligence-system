INSERT INTO storage.buckets (id, name, public) VALUES ('import-files','import-files',FALSE),('avatars','avatars',TRUE) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "import_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id='import-files' AND auth.uid()::text=(storage.foldername(name))[1]);
CREATE POLICY "import_read" ON storage.objects FOR SELECT USING (bucket_id='import-files' AND auth.uid()::text=(storage.foldername(name))[1]);
CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id='avatars' AND auth.uid()::text=(storage.foldername(name))[1]);
CREATE POLICY "avatars_read" ON storage.objects FOR SELECT USING (bucket_id='avatars');
