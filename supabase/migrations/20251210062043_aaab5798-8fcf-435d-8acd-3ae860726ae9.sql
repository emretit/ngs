-- Recreate product_warehouse_stocks view with SECURITY INVOKER
DROP VIEW IF EXISTS public.product_warehouse_stocks;
CREATE VIEW public.product_warehouse_stocks 
WITH (security_invoker = true)
AS
SELECT p.id AS product_id,
    w.id AS warehouse_id,
    w.name AS warehouse_name,
    w.code AS warehouse_code,
    COALESCE(sum(
        CASE
            WHEN ((it.transaction_type = 'giris'::text) AND (it.warehouse_id = w.id)) THEN iti.quantity
            WHEN ((it.transaction_type = 'cikis'::text) AND (it.warehouse_id = w.id)) THEN (- iti.quantity)
            WHEN ((it.transaction_type = 'transfer'::text) AND (it.from_warehouse_id = w.id)) THEN (- iti.quantity)
            WHEN ((it.transaction_type = 'transfer'::text) AND (it.to_warehouse_id = w.id)) THEN iti.quantity
            WHEN ((it.transaction_type = 'sayim'::text) AND (it.warehouse_id = w.id)) THEN iti.quantity
            ELSE (0)::numeric
        END), (0)::numeric) AS stock_quantity,
    p.unit
FROM (((products p
    CROSS JOIN warehouses w)
    LEFT JOIN inventory_transactions it ON ((((it.warehouse_id = w.id) OR (it.from_warehouse_id = w.id) OR (it.to_warehouse_id = w.id)) AND (it.status = 'completed'::text))))
    LEFT JOIN inventory_transaction_items iti ON (((iti.transaction_id = it.id) AND (iti.product_id = p.id))))
GROUP BY p.id, w.id, w.name, w.code, p.unit;

-- Recreate proposal_stock_view with SECURITY INVOKER
DROP VIEW IF EXISTS public.proposal_stock_view;
CREATE VIEW public.proposal_stock_view 
WITH (security_invoker = true)
AS
SELECT p.number AS proposal_number,
    p.title AS proposal_title,
    p.status AS proposal_status,
    p.total_amount AS proposal_total,
    p.currency AS proposal_currency,
    p.valid_until,
    c.company AS customer_name,
    p.items
FROM (proposals p
    LEFT JOIN customers c ON ((p.customer_id = c.id)));