-- Migration: Simplify leave_type_rules RLS policies - allow authenticated users
-- Admin kontrolünü kaldırıp sadece company kontrolü yapalım

-- Önce mevcut policy'leri kaldır
DROP POLICY IF EXISTS "Admins can insert leave type rules" ON leave_type_rules;
DROP POLICY IF EXISTS "Admins can update leave type rules" ON leave_type_rules;
DROP POLICY IF EXISTS "Admins can delete leave type rules" ON leave_type_rules;

-- INSERT policy - Authenticated kullanıcılar kendi şirketleri için ekleyebilir
CREATE POLICY "Users can insert leave type rules"
  ON leave_type_rules FOR INSERT
  WITH CHECK (tenant_id = current_company_id());

-- UPDATE policy - Authenticated kullanıcılar kendi şirketlerinin kurallarını güncelleyebilir
CREATE POLICY "Users can update leave type rules"
  ON leave_type_rules FOR UPDATE
  USING (tenant_id = current_company_id())
  WITH CHECK (tenant_id = current_company_id());

-- DELETE policy - Authenticated kullanıcılar kendi şirketlerinin kurallarını silebilir
CREATE POLICY "Users can delete leave type rules"
  ON leave_type_rules FOR DELETE
  USING (tenant_id = current_company_id());

-- Yorum: Admin kontrolü kaldırıldı, sadece company_id kontrolü yapılıyor
-- Frontend'de admin kontrolü yapılabilir
