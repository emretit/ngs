-- Migration: Fix leave_type_rules RLS policies to use current_company_id() function
-- Şu anda karmaşık JOIN'ler kullanıyor, basit current_company_id() kullanmalı

-- Önce tüm leave_type_rules policy'lerini kaldır
DROP POLICY IF EXISTS "Users can view leave type rules in their company" ON leave_type_rules;
DROP POLICY IF EXISTS "Admins can insert leave type rules" ON leave_type_rules;
DROP POLICY IF EXISTS "Admins can update leave type rules" ON leave_type_rules;
DROP POLICY IF EXISTS "Admins can delete leave type rules" ON leave_type_rules;

-- SELECT policy - Herkes kendi şirketinin kurallarını görebilir
CREATE POLICY "Users can view leave type rules in their company"
  ON leave_type_rules FOR SELECT
  USING (tenant_id = current_company_id());

-- INSERT policy - Sadece adminler ekleyebilir
CREATE POLICY "Admins can insert leave type rules"
  ON leave_type_rules FOR INSERT
  WITH CHECK (
    tenant_id = current_company_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- UPDATE policy - Sadece adminler güncelleyebilir
CREATE POLICY "Admins can update leave type rules"
  ON leave_type_rules FOR UPDATE
  USING (
    tenant_id = current_company_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  )
  WITH CHECK (
    tenant_id = current_company_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- DELETE policy - Sadece adminler silebilir
CREATE POLICY "Admins can delete leave type rules"
  ON leave_type_rules FOR DELETE
  USING (
    tenant_id = current_company_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- Yorum: current_company_id() fonksiyonu kullanılarak RLS policy'ler basitleştirildi
-- tenant_id = current_company_id() kontrolü eklendi
