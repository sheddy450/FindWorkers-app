-- 10 more trades. Safe to run on any database: a trade is skipped if its slug already exists, or if an
-- active category with the same name (any capitalisation) was already added by an admin.
INSERT INTO "ServiceCategory" ("id", "slug", "name", "isActive")
SELECT 'cat_' || replace(gen_random_uuid()::text, '-', ''), t.slug, t.name, true
FROM (VALUES
  ('welder', 'Welder & fabricator'),
  ('bricklayer', 'Bricklayer & mason'),
  ('furniture-maker', 'Furniture maker'),
  ('upholsterer', 'Upholsterer'),
  ('shoemaker', 'Shoemaker & leatherworker'),
  ('embroiderer', 'Embroiderer'),
  ('aso-oke-weaver', 'Aso-oke weaver'),
  ('jeweller', 'Jeweller (gold & silver)'),
  ('watch-repairer', 'Watch repairer'),
  ('baker', 'Baker & cake maker')
) AS t(slug, name)
WHERE NOT EXISTS (SELECT 1 FROM "ServiceCategory" c WHERE c.slug = t.slug)
  AND NOT EXISTS (SELECT 1 FROM "ServiceCategory" c WHERE c."isActive" AND lower(c.name) = lower(t.name));
