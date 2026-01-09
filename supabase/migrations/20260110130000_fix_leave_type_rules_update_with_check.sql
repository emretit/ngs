-- Migration: Fix leave_type_rules UPDATE RLS policy - add WITH CHECK
-- UPDATE işlemi USING ile kontrol ediyor ama WITH CHECK eksik

-- Önce mevcut UPDATE policy'yi kaldır
DROP POLICY IF EXISTS "Admins can update leave type rules" ON leave_type_rules;

-- Yeni policy oluştur - hem USING hem WITH CHECK ile
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
  )
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

-- Yorum: WITH CHECK eklendi, UPDATE işlemi artık çalışmalı
