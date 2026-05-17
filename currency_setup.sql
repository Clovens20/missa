-- Add/update shop currency setting to CAD in shop_settings
INSERT INTO shop_settings 
  (key, value) 
VALUES
  ('currency', 'CAD')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;
