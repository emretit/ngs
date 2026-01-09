-- Migration: Fix leave_type_rules RLS policies to use user_roles table
-- Eski policy'ler profiles.role kullanıyordu ama sistem user_roles tablosu kullanıyor

-- Önce eski policy'leri kaldır
DROP POLICY IF EXISTS "Admins can insert leave type rules" ON leave_type_rules;
DROP POLICY IF EXISTS "Admins can update leave type rules" ON leave_type_rules;
DROP POLICY IF EXISTS "Admins can delete leave type rules" ON leave_type_rules;

-- Yeni policy'leri user_roles tablosu ile oluştur
CREATE POLICY "Admins can insert leave type rules"
  ON leave_type_rules FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT p.company_id 
      FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id
      JOIN roles r ON r.id = ur.role_id
      WHERE p.id = auth.uid() 
        AND r.name = 'admin'
    )
  );

CREATE POLICY "Admins can update leave type rules"
  ON leave_type_rules FOR UPDATE
  USING (
    tenant_id IN (
      SELECT p.company_id 
      FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id
      JOIN roles r ON r.id = ur.role_id
      WHERE p.id = auth.uid() 
        AND r.name = 'admin'
    )
  );

CREATE POLICY "Admins can delete leave type rules"
  ON leave_type_rules FOR DELETE
  USING (
    tenant_id IN (
      SELECT p.company_id 
      FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id
      JOIN roles r ON r.id = ur.role_id
      WHERE p.id = auth.uid() 
        AND r.name = 'admin'
    )
  );

-- Yorum: Bu migration ile RLS policy'leri düzeltildi
-- Artık user_roles tablosu üzerinden admin kontrolü yapılıyor
