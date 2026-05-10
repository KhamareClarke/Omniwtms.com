-- Storage usage (GB) from Supabase Storage for warehouse-assets objects linked to tenant warehouses.

BEGIN;

CREATE OR REPLACE FUNCTION public.tenant_storage_used_gb(p_tenant_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT round(
    (
      COALESCE(
        SUM((NULLIF(trim(o.metadata ->> 'size'), ''))::bigint),
        0
      )::numeric / 1073741824.0
    )::numeric,
    6
  )
  FROM storage.objects o
  WHERE o.bucket_id = 'warehouse-assets'
    AND EXISTS (
      SELECT 1
      FROM public.warehouses w
      WHERE w.tenant_id = p_tenant_id
        AND o.name LIKE '%' || w.id::text || '%'
    );
$$;

COMMENT ON FUNCTION public.tenant_storage_used_gb(uuid) IS 'Sum object sizes in warehouse-assets where object name contains a warehouse id for this tenant.';

GRANT EXECUTE ON FUNCTION public.tenant_storage_used_gb(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.tenant_storage_used_gb(uuid) TO authenticated;

COMMIT;
