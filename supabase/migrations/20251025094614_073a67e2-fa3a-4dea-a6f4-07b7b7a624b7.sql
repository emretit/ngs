-- Create storage bucket for company assets (logos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for company-assets bucket
-- Super admins can upload
CREATE POLICY "Super admins can upload company assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- Super admins can update
CREATE POLICY "Super admins can update company assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-assets' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- Super admins can delete
CREATE POLICY "Super admins can delete company assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-assets' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- Everyone can view (public bucket)
CREATE POLICY "Public can view company assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');