-- Step 1: Expand roles table structure
ALTER TABLE roles 
  ADD COLUMN IF NOT EXISTS parent_role_id UUID REFERENCES roles(id),
  ADD COLUMN IF NOT EXISTS role_type TEXT DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Step 2: Add role_id to user_roles to connect with roles table
ALTER TABLE user_roles 
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- Step 3: Create security definer function for permission checking
CREATE OR REPLACE FUNCTION public.check_user_module_access(
  _user_id uuid, 
  _module text, 
  _action text DEFAULT 'access'
) RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_permission boolean;
BEGIN
  -- Check if user has the requested permission for the module
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.company_id = (
        SELECT company_id FROM profiles WHERE id = _user_id LIMIT 1
      )
      AND r.is_active = true
      AND (r.permissions->'modules'->_module->>_action)::boolean = true
  ) INTO has_permission;
  
  RETURN COALESCE(has_permission, false);
END;
$$;

-- Step 4: Update existing roles to use new module-based permission structure
-- This will transform existing flat permissions to module-based CRUD structure
UPDATE roles 
SET permissions = jsonb_build_object(
  'modules', jsonb_build_object(
    'dashboard', jsonb_build_object('access', true, 'create', false, 'read', true, 'update', false, 'delete', false, 'export', false),
    'customers', jsonb_build_object('access', 
      CASE WHEN permissions ? 'customers' THEN true ELSE false END,
      'create', 
      CASE WHEN permissions ? 'customers' THEN true ELSE false END,
      'read', 
      CASE WHEN permissions ? 'customers' THEN true ELSE false END,
      'update', 
      CASE WHEN permissions ? 'customers' THEN true ELSE false END,
      'delete', false,
      'export', 
      CASE WHEN permissions ? 'customers' THEN true ELSE false END
    ),
    'suppliers', jsonb_build_object('access', 
      CASE WHEN permissions ? 'suppliers' THEN true ELSE false END,
      'create', 
      CASE WHEN permissions ? 'suppliers' THEN true ELSE false END,
      'read', 
      CASE WHEN permissions ? 'suppliers' THEN true ELSE false END,
      'update', 
      CASE WHEN permissions ? 'suppliers' THEN true ELSE false END,
      'delete', false,
      'export', true
    ),
    'proposals', jsonb_build_object('access', 
      CASE WHEN permissions ? 'proposals' THEN true ELSE false END,
      'create', 
      CASE WHEN permissions ? 'proposals' THEN true ELSE false END,
      'read', 
      CASE WHEN permissions ? 'proposals' THEN true ELSE false END,
      'update', 
      CASE WHEN permissions ? 'proposals' THEN true ELSE false END,
      'delete', 
      CASE WHEN permissions ? 'proposals' THEN true ELSE false END,
      'export', true
    ),
    'orders', jsonb_build_object('access', 
      CASE WHEN permissions ? 'orders' THEN true ELSE false END,
      'create', 
      CASE WHEN permissions ? 'orders' THEN true ELSE false END,
      'read', 
      CASE WHEN permissions ? 'orders' THEN true ELSE false END,
      'update', 
      CASE WHEN permissions ? 'orders' THEN true ELSE false END,
      'delete', false,
      'export', true
    ),
    'purchases', jsonb_build_object('access', 
      CASE WHEN permissions ? 'purchases' THEN true ELSE false END,
      'create', 
      CASE WHEN permissions ? 'purchases' THEN true ELSE false END,
      'read', 
      CASE WHEN permissions ? 'purchases' THEN true ELSE false END,
      'update', 
      CASE WHEN permissions ? 'purchases' THEN true ELSE false END,
      'delete', false,
      'export', true
    ),
    'service', jsonb_build_object('access', 
      CASE WHEN permissions ? 'service' THEN true ELSE false END,
      'create', 
      CASE WHEN permissions ? 'service' THEN true ELSE false END,
      'read', 
      CASE WHEN permissions ? 'service' THEN true ELSE false END,
      'update', 
      CASE WHEN permissions ? 'service' THEN true ELSE false END,
      'delete', false,
      'export', true
    ),
    'invoices', jsonb_build_object('access', 
      CASE WHEN permissions ? 'invoices' THEN true ELSE false END,
      'create', 
      CASE WHEN permissions ? 'invoices' THEN true ELSE false END,
      'read', 
      CASE WHEN permissions ? 'invoices' THEN true ELSE false END,
      'update', 
      CASE WHEN permissions ? 'invoices' THEN true ELSE false END,
      'delete', false,
      'export', true
    ),
    'cashflow', jsonb_build_object('access', 
      CASE WHEN permissions ? 'cashflow' THEN true ELSE false END,
      'create', 
      CASE WHEN permissions ? 'cashflow' THEN true ELSE false END,
      'read', 
      CASE WHEN permissions ? 'cashflow' THEN true ELSE false END,
      'update', 
      CASE WHEN permissions ? 'cashflow' THEN true ELSE false END,
      'delete', false,
      'export', true
    ),
    'products', jsonb_build_object('access', 
      CASE WHEN permissions ? 'products' THEN true ELSE false END,
      'create', 
      CASE WHEN permissions ? 'products' THEN true ELSE false END,
      'read', 
      CASE WHEN permissions ? 'products' THEN true ELSE false END,
      'update', 
      CASE WHEN permissions ? 'products' THEN true ELSE false END,
      'delete', false,
      'export', true
    ),
    'employees', jsonb_build_object('access', 
      CASE WHEN permissions ? 'employees' THEN true ELSE false END,
      'create', 
      CASE WHEN permissions ? 'employees' THEN true ELSE false END,
      'read', 
      CASE WHEN permissions ? 'employees' THEN true ELSE false END,
      'update', 
      CASE WHEN permissions ? 'employees' THEN true ELSE false END,
      'delete', false,
      'export', true
    ),
    'vehicles', jsonb_build_object('access', 
      CASE WHEN permissions ? 'vehicles' THEN true ELSE false END,
      'create', 
      CASE WHEN permissions ? 'vehicles' THEN true ELSE false END,
      'read', 
      CASE WHEN permissions ? 'vehicles' THEN true ELSE false END,
      'update', 
      CASE WHEN permissions ? 'vehicles' THEN true ELSE false END,
      'delete', false,
      'export', true
    ),
    'reports', jsonb_build_object('access', 
      CASE WHEN permissions ? 'reports' THEN true ELSE false END,
      'create', false,
      'read', 
      CASE WHEN permissions ? 'reports' THEN true ELSE false END,
      'update', false,
      'delete', false,
      'export', true
    ),
    'modules', jsonb_build_object('access', 
      CASE WHEN permissions ? 'modules' THEN true ELSE false END,
      'create', 
      CASE WHEN permissions ? 'modules' THEN true ELSE false END,
      'read', 
      CASE WHEN permissions ? 'modules' THEN true ELSE false END,
      'update', 
      CASE WHEN permissions ? 'modules' THEN true ELSE false END,
      'delete', 
      CASE WHEN permissions ? 'modules' THEN true ELSE false END,
      'export', false
    ),
    'settings', jsonb_build_object('access', 
      CASE WHEN permissions ? 'settings' THEN true ELSE false END,
      'create', 
      CASE WHEN permissions ? 'settings' THEN true ELSE false END,
      'read', 
      CASE WHEN permissions ? 'settings' THEN true ELSE false END,
      'update', 
      CASE WHEN permissions ? 'settings' THEN true ELSE false END,
      'delete', 
      CASE WHEN permissions ? 'settings' THEN true ELSE false END,
      'export', false
    )
  )
)
WHERE permissions IS NOT NULL 
  AND NOT (permissions ? 'modules');

-- Step 5: Link existing user_roles to roles table
UPDATE user_roles ur
SET role_id = (
  SELECT r.id 
  FROM roles r 
  WHERE r.company_id = (
    SELECT company_id FROM profiles WHERE id = ur.user_id LIMIT 1
  )
  AND LOWER(r.name) LIKE '%' || LOWER(ur.role::text) || '%'
  LIMIT 1
)
WHERE role_id IS NULL;