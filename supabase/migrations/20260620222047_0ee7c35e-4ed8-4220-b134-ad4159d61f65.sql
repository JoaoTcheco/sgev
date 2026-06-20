
CREATE POLICY "Authenticated can read docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'docs');
