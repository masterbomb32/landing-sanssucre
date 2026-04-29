
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.claim_admin_if_first() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_first() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.redeem_signup(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_signup(text) TO authenticated;
