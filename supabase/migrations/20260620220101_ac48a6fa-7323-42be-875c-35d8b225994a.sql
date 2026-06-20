
-- Remove deletion-approval workflow entirely
DROP FUNCTION IF EXISTS public.request_deletion(text, uuid, text);
DROP FUNCTION IF EXISTS public.review_deletion(uuid, boolean, text);
DROP TABLE IF EXISTS public.deletion_requests;
DROP TYPE IF EXISTS public.deletion_status;
