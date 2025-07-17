-- PostgreSQL Views for better query performance
-- Run this after migration

-- View for active verified connections
CREATE OR REPLACE VIEW active_email_connections AS
SELECT 
    ec.*,
    u.name as user_name,
    u.email as user_email
FROM email_connections ec
JOIN users u ON ec.user_id = u.id
WHERE ec.is_active = true 
  AND ec.is_verified = true;

-- View for connection statistics
CREATE OR REPLACE VIEW email_connection_stats AS
SELECT 
    user_id,
    provider,
    COUNT(*) as total_connections,
    COUNT(*) FILTER (WHERE is_verified = true) as verified_connections,
    COUNT(*) FILTER (WHERE sync_errors IS NOT NULL) as failed_connections,
    MAX(last_sync_at) as last_successful_sync,
    MIN(created_at) as first_connection_date
FROM email_connections
GROUP BY user_id, provider;

-- Function to clean old sync errors (PostgreSQL stored procedure)
CREATE OR REPLACE FUNCTION clean_old_sync_errors()
RETURNS void AS $$
BEGIN
    UPDATE email_connections 
    SET sync_errors = (
        SELECT jsonb_agg(error_item)
        FROM jsonb_array_elements(sync_errors) AS error_item
        WHERE (error_item->>'timestamp')::timestamp > NOW() - INTERVAL '30 days'
    )
    WHERE sync_errors IS NOT NULL
      AND jsonb_array_length(sync_errors) > 0;
      
    -- Set to NULL if no errors remain
    UPDATE email_connections 
    SET sync_errors = NULL 
    WHERE sync_errors = '[]'::jsonb;
END;
$$ LANGUAGE plpgsql;
