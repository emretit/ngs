-- Remove the organization tables we created since the app already uses company_id structure
DROP TABLE IF EXISTS org_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP VIEW IF EXISTS v_user_orgs CASCADE;
DROP TABLE IF EXISTS user_prefs CASCADE;