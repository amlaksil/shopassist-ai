insert into faq_articles (id, question, answer, category, keywords)
values
  (
    '2f7f27ca-4b61-4a90-a0c0-21b6f4ce0401',
    'How long does shipping take?',
    'Standard shipping takes 3 to 5 business days. Express shipping takes 1 to 2 business days after the order is processed.',
    'shipping',
    array['shipping', 'delivery', 'arrival', 'express', 'standard']
  ),
  (
    '78e5544a-a98b-4aa0-b1c3-3514aa45c250',
    'Can I return an item if I changed my mind?',
    'Yes. Unused items in original packaging can be returned within 30 days of delivery. Final-sale items are excluded.',
    'returns',
    array['return', 'exchange', 'changed my mind', 'policy', '30 days']
  ),
  (
    'ed4f4d7d-16d2-4e2f-a345-ddc52f75cad8',
    'When are refunds issued?',
    'Approved refunds are sent to the original payment method within 5 to 7 business days after the return is inspected.',
    'refund',
    array['refund', 'money back', 'business days', 'payment method']
  ),
  (
    '5f7f0119-3751-478a-a973-fa5a0a58f9ab',
    'Why was my card declined?',
    'Card declines can happen because of billing address mismatches, insufficient funds, or bank fraud checks. Customers should retry or contact their bank.',
    'payments',
    array['payment', 'card', 'declined', 'bank', 'billing']
  ),
  (
    '0f04c08f-7a48-4b55-83eb-9c7894d64817',
    'How do I reset my account password?',
    'Use the Forgot Password link on the sign-in page. A reset email is sent within a few minutes.',
    'account',
    array['password', 'login', 'account', 'reset', 'sign in']
  ),
  (
    '95931b57-f76b-4c5c-8db9-6b3d1fa58589',
    'How can I track my order?',
    'Open the order confirmation email or your account orders page to view tracking details once the package ships.',
    'orders',
    array['track', 'order', 'package', 'tracking', 'shipment']
  ),
  (
    '070f6d80-3fd2-4362-b84f-7f2287fc675c',
    'Do you offer warranty coverage for electronics?',
    'Select electronics include a one-year limited warranty covering manufacturing defects. Accidental damage is not included.',
    'product',
    array['warranty', 'electronics', 'defect', 'coverage']
  )
on conflict (id) do update set
  question = excluded.question,
  answer = excluded.answer,
  category = excluded.category,
  keywords = excluded.keywords;

insert into products (
  id,
  name,
  sku,
  description,
  price,
  currency,
  category,
  inventory_status,
  attributes
)
values
  (
    '31d564b1-1d0c-4db9-83af-98ca58ef56f7',
    'Atlas Wireless Headphones',
    'ATL-HDP-001',
    'Over-ear wireless headphones with active noise cancellation, USB-C fast charging, and 32-hour battery life.',
    179.00,
    'USD',
    'audio',
    'in_stock',
    array['bluetooth 5.3', 'noise cancellation', '32-hour battery', 'usb-c']
  ),
  (
    '7ddfc3cb-63af-48f7-8b58-d7d73c669f44',
    'Northstar Everyday Backpack',
    'NOR-BAG-020',
    'Water-resistant commuter backpack with a 16-inch laptop sleeve and modular interior pockets.',
    96.00,
    'USD',
    'bags',
    'in_stock',
    array['water-resistant', 'laptop sleeve', 'carry-on friendly']
  ),
  (
    '1fc4dd16-4257-4030-a7e5-b6d3df4b0b93',
    'Luma Smart Desk Lamp',
    'LUM-LMP-210',
    'Adjustable LED desk lamp with touch dimming, color temperature presets, and a built-in USB charging port.',
    72.00,
    'USD',
    'home office',
    'low_stock',
    array['touch dimming', 'usb charging', 'warm and cool light']
  ),
  (
    'e21bf2e0-db5a-4db8-b3b4-6e779d9584b8',
    'Terra Insulated Bottle',
    'TER-BTL-145',
    'Vacuum-insulated stainless steel bottle that keeps drinks cold for 24 hours or hot for 12 hours.',
    34.00,
    'USD',
    'lifestyle',
    'in_stock',
    array['24-hour cold', '12-hour hot', 'bpa free']
  ),
  (
    'dcab0f8d-677a-41bc-aad8-c15db3be89d2',
    'Drift Performance Sneakers',
    'DRF-SHO-440',
    'Lightweight knit sneakers designed for all-day wear with responsive foam cushioning.',
    128.00,
    'USD',
    'footwear',
    'backorder',
    array['knit upper', 'foam cushioning', 'everyday comfort']
  ),
  (
    '9088117f-9dd8-443c-90c4-2e093f00f8a6',
    'Mira Ceramic Skincare Fridge',
    'MIR-BEA-305',
    'Compact mini fridge for skincare storage with quiet cooling mode and a mirrored front door.',
    149.00,
    'USD',
    'beauty tech',
    'in_stock',
    array['quiet cooling', 'mirrored door', 'compact']
  )
on conflict (id) do update set
  name = excluded.name,
  sku = excluded.sku,
  description = excluded.description,
  price = excluded.price,
  currency = excluded.currency,
  category = excluded.category,
  inventory_status = excluded.inventory_status,
  attributes = excluded.attributes;
