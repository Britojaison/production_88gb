-- ============================================================
-- Option 1 (Global): Mark SSS Deck Shoot on 27/08/2026 as the ONLY paid expense.
-- All other expenses across the entire app are marked as NOT paid (unpaid).
-- ============================================================

BEGIN;

-- 1. Reset all expenses to unpaid
UPDATE "expenses_slate"
SET "paid" = false,
    "paidAt" = NULL;

-- 2. Mark only the SSS Deck Shoot expense on 27/08/2026 as paid
UPDATE "expenses_slate"
SET "paid" = true,
    "paidAt" = '2026-08-27 00:00:00'
WHERE "shootId" IN (
    SELECT "id" FROM "shoots_slate"
    WHERE "name" ILIKE '%SSS Deck Shoot%'
)
AND "date"::date = '2026-08-27';

COMMIT;

-- Verification: Check that only 1 expense is marked paid
SELECT 
    e."id",
    s."name" AS "shootName",
    e."title",
    e."paidTo",
    e."amount",
    e."date"::date AS "date",
    e."paid",
    e."paidAt"
FROM "expenses_slate" e
JOIN "shoots_slate" s ON e."shootId" = s."id"
WHERE e."paid" = true;


-- ============================================================
-- Option 2 (Shoot-only): Only modify expenses inside 'SSS Deck Shoot'
-- (Leave expenses belonging to other shoots untouched)
-- ============================================================
/*
BEGIN;

UPDATE "expenses_slate"
SET "paid" = CASE 
        WHEN "date"::date = '2026-08-27' THEN true 
        ELSE false 
    END,
    "paidAt" = CASE 
        WHEN "date"::date = '2026-08-27' THEN '2026-08-27 00:00:00' 
        ELSE NULL 
    END
WHERE "shootId" IN (
    SELECT "id" FROM "shoots_slate" 
    WHERE "name" ILIKE '%SSS Deck Shoot%'
);

COMMIT;
*/
