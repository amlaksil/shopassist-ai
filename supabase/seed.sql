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

insert into support_admin_emails (email, display_name, is_active)
values
  ('support@shopassist.local', 'Support Lead', true),
  ('hana@shopassist.local', 'Hana Tesfaye', true),
  ('samuel@shopassist.local', 'Samuel Bekele', true),
  ('meklit@shopassist.local', 'Meklit Alemu', true)
on conflict (email) do update set
  display_name = excluded.display_name,
  is_active = excluded.is_active,
  updated_at = now();

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

insert into customers (id, customer_code, name, email, created_at, updated_at)
values
  (
    '6a4835c1-8948-44cc-a7b7-ae814ec0e593',
    'CUST-1001',
    'Hanna Bekele',
    'hanna.bekele@example.com',
    '2026-05-02T10:00:00.000Z',
    '2026-06-11T15:30:00.000Z'
  ),
  (
    '511cf0f5-09c3-4da4-8c43-065e7d3ba12e',
    'CUST-1002',
    'Daniel Tesfaye',
    'daniel.tesfaye@example.com',
    '2026-05-19T09:15:00.000Z',
    '2026-06-12T08:40:00.000Z'
  ),
  (
    '019afbe8-5848-430b-9cf9-0b1dcd827035',
    'CUST-1003',
    'Eden Ali',
    'eden.ali@example.com',
    '2026-06-01T12:20:00.000Z',
    '2026-06-11T18:10:00.000Z'
  ),
  (
    '5a5cbd89-d68b-4e04-b80b-712ceba07943',
    'CUST-1004',
    'Naomi Rivera',
    'naomi.rivera@example.com',
    '2026-04-26T14:05:00.000Z',
    '2026-06-10T16:25:00.000Z'
  )
on conflict (id) do update set
  customer_code = excluded.customer_code,
  name = excluded.name,
  email = excluded.email,
  updated_at = excluded.updated_at;

insert into orders (
  id,
  order_number,
  customer_id,
  status,
  total_amount,
  currency,
  placed_at,
  shipping_address,
  created_at,
  updated_at
)
values
  (
    '8db8d98e-06d9-47ff-a991-e5528de74cea',
    'ORD-1001',
    '6a4835c1-8948-44cc-a7b7-ae814ec0e593',
    'delivered',
    179.00,
    'USD',
    '2026-06-03T10:25:00.000Z',
    '1450 West Lake St, Chicago, IL 60607',
    '2026-06-03T10:25:00.000Z',
    '2026-06-08T16:10:00.000Z'
  ),
  (
    'f86a5f2d-c8bd-4cf0-a837-7cc20caf0b67',
    'ORD-1002',
    '511cf0f5-09c3-4da4-8c43-065e7d3ba12e',
    'shipped',
    96.00,
    'USD',
    '2026-06-09T09:45:00.000Z',
    '780 Grant Ave, Seattle, WA 98109',
    '2026-06-09T09:45:00.000Z',
    '2026-06-12T07:30:00.000Z'
  ),
  (
    'c3c55e67-9bb1-4574-b8bc-e2865e27ce77',
    'ORD-1003',
    '019afbe8-5848-430b-9cf9-0b1dcd827035',
    'processing',
    34.00,
    'USD',
    '2026-06-11T17:12:00.000Z',
    '112 Pine Street, Austin, TX 78701',
    '2026-06-11T17:12:00.000Z',
    '2026-06-12T09:05:00.000Z'
  ),
  (
    '1cf7e6f9-26fe-440a-b905-fbe00da8a302',
    'ORD-1004',
    '6a4835c1-8948-44cc-a7b7-ae814ec0e593',
    'shipped',
    128.00,
    'USD',
    '2026-06-10T13:22:00.000Z',
    '1450 West Lake St, Chicago, IL 60607',
    '2026-06-10T13:22:00.000Z',
    '2026-06-12T05:40:00.000Z'
  ),
  (
    '9b843642-3f57-4f42-8d9e-cbc3f9a4a1db',
    'ORD-1005',
    '5a5cbd89-d68b-4e04-b80b-712ceba07943',
    'delivered',
    149.00,
    'USD',
    '2026-04-22T11:18:00.000Z',
    '490 Cedar Ave, Denver, CO 80203',
    '2026-04-22T11:18:00.000Z',
    '2026-04-28T13:50:00.000Z'
  ),
  (
    'f9b5ba34-6642-4f8d-a74d-9260a4539c73',
    'ORD-1006',
    '5a5cbd89-d68b-4e04-b80b-712ceba07943',
    'delivered',
    72.00,
    'USD',
    '2026-06-02T15:05:00.000Z',
    '490 Cedar Ave, Denver, CO 80203',
    '2026-06-02T15:05:00.000Z',
    '2026-06-11T12:15:00.000Z'
  )
on conflict (id) do update set
  order_number = excluded.order_number,
  customer_id = excluded.customer_id,
  status = excluded.status,
  total_amount = excluded.total_amount,
  currency = excluded.currency,
  placed_at = excluded.placed_at,
  shipping_address = excluded.shipping_address,
  updated_at = excluded.updated_at;

insert into order_items (
  id,
  order_id,
  product_name,
  sku,
  quantity,
  unit_price,
  currency,
  created_at
)
values
  (
    'a3c42a0c-9c0f-4dfa-8ab6-e7661fd8d2bb',
    '8db8d98e-06d9-47ff-a991-e5528de74cea',
    'Atlas Wireless Headphones',
    'ATL-HDP-001',
    1,
    179.00,
    'USD',
    '2026-06-03T10:25:00.000Z'
  ),
  (
    '00a436f7-4838-405e-8a45-c6e720d6458a',
    'f86a5f2d-c8bd-4cf0-a837-7cc20caf0b67',
    'Northstar Everyday Backpack',
    'NOR-BAG-020',
    1,
    96.00,
    'USD',
    '2026-06-09T09:45:00.000Z'
  ),
  (
    '0cf96295-3a88-45bd-9b72-3454cd673b2a',
    'c3c55e67-9bb1-4574-b8bc-e2865e27ce77',
    'Terra Insulated Bottle',
    'TER-BTL-145',
    1,
    34.00,
    'USD',
    '2026-06-11T17:12:00.000Z'
  ),
  (
    'cfd6e395-3543-4df8-b8af-e95f7fe93fda',
    '1cf7e6f9-26fe-440a-b905-fbe00da8a302',
    'Drift Performance Sneakers',
    'DRF-SHO-440',
    1,
    128.00,
    'USD',
    '2026-06-10T13:22:00.000Z'
  ),
  (
    'e9d8ad95-d7ef-48a7-b7c0-4824a1551dcf',
    '9b843642-3f57-4f42-8d9e-cbc3f9a4a1db',
    'Mira Ceramic Skincare Fridge',
    'MIR-BEA-305',
    1,
    149.00,
    'USD',
    '2026-04-22T11:18:00.000Z'
  ),
  (
    'f68e2373-2298-44ce-8707-97002c06b2a8',
    'f9b5ba34-6642-4f8d-a74d-9260a4539c73',
    'Luma Smart Desk Lamp',
    'LUM-LMP-210',
    1,
    72.00,
    'USD',
    '2026-06-02T15:05:00.000Z'
  )
on conflict (id) do update set
  order_id = excluded.order_id,
  product_name = excluded.product_name,
  sku = excluded.sku,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  currency = excluded.currency;

insert into shipments (
  id,
  order_id,
  tracking_number,
  carrier,
  status,
  latest_update,
  last_location,
  estimated_delivery_date,
  shipped_at,
  delivered_at,
  created_at,
  updated_at
)
values
  (
    '2a211e01-ee55-46a2-a4ad-c13f1f6df4f0',
    '8db8d98e-06d9-47ff-a991-e5528de74cea',
    'PP1001001',
    'ParcelPath',
    'delivered',
    'Delivered at front desk.',
    'Chicago, IL',
    '2026-06-08',
    '2026-06-05T08:40:00.000Z',
    '2026-06-08T16:10:00.000Z',
    '2026-06-05T08:40:00.000Z',
    '2026-06-08T16:10:00.000Z'
  ),
  (
    'c39e0d37-9340-4409-bb8f-a0927d881537',
    'f86a5f2d-c8bd-4cf0-a837-7cc20caf0b67',
    'SLX9023345',
    'Skyline Express',
    'in_transit',
    'Left the regional sorting hub early this morning.',
    'Portland, OR',
    '2026-06-14',
    '2026-06-10T14:20:00.000Z',
    null,
    '2026-06-10T14:20:00.000Z',
    '2026-06-12T07:30:00.000Z'
  ),
  (
    'b3da1d77-0dfe-453d-9f7b-2a16ac18292e',
    '1cf7e6f9-26fe-440a-b905-fbe00da8a302',
    'FRT4481202',
    'FirstRoute',
    'delayed',
    'Weather delay reported by the carrier. A new scan is expected within 24 hours.',
    'Milwaukee, WI',
    '2026-06-15',
    '2026-06-11T11:05:00.000Z',
    null,
    '2026-06-11T11:05:00.000Z',
    '2026-06-12T05:40:00.000Z'
  ),
  (
    'f0a812b4-0ef2-485e-a79b-9171034573a6',
    '9b843642-3f57-4f42-8d9e-cbc3f9a4a1db',
    'RMX5017704',
    'RapidMove',
    'delivered',
    'Delivered to the front porch.',
    'Denver, CO',
    '2026-04-28',
    '2026-04-24T09:15:00.000Z',
    '2026-04-28T13:50:00.000Z',
    '2026-04-24T09:15:00.000Z',
    '2026-04-28T13:50:00.000Z'
  ),
  (
    'd3e64b29-b8b3-45a1-af2c-45259b80cfd0',
    'f9b5ba34-6642-4f8d-a74d-9260a4539c73',
    'CNR2204819',
    'CourierNorth',
    'delivered',
    'Delivered to the mail room.',
    'Denver, CO',
    '2026-06-07',
    '2026-06-04T10:40:00.000Z',
    '2026-06-07T12:05:00.000Z',
    '2026-06-04T10:40:00.000Z',
    '2026-06-07T12:05:00.000Z'
  )
on conflict (id) do update set
  order_id = excluded.order_id,
  tracking_number = excluded.tracking_number,
  carrier = excluded.carrier,
  status = excluded.status,
  latest_update = excluded.latest_update,
  last_location = excluded.last_location,
  estimated_delivery_date = excluded.estimated_delivery_date,
  shipped_at = excluded.shipped_at,
  delivered_at = excluded.delivered_at,
  updated_at = excluded.updated_at;

insert into returns (id, order_id, status, reason, requested_at, updated_at)
values
  (
    '682ff33d-08a0-4c0c-b7a7-7f25c6dff8d0',
    '1cf7e6f9-26fe-440a-b905-fbe00da8a302',
    'approved',
    'Wrong size ordered',
    '2026-06-12T08:55:00.000Z',
    '2026-06-12T09:20:00.000Z'
  ),
  (
    '57a1f9f0-f75f-4975-b854-ad8d8440b874',
    'f9b5ba34-6642-4f8d-a74d-9260a4539c73',
    'completed',
    'Lamp arrived damaged',
    '2026-06-08T09:10:00.000Z',
    '2026-06-10T15:25:00.000Z'
  )
on conflict (id) do update set
  order_id = excluded.order_id,
  status = excluded.status,
  reason = excluded.reason,
  requested_at = excluded.requested_at,
  updated_at = excluded.updated_at;

insert into refunds (id, order_id, status, amount, currency, requested_at, processed_at, updated_at)
values
  (
    '1cc89fd3-e040-46eb-b8ce-e99a796ec812',
    '1cf7e6f9-26fe-440a-b905-fbe00da8a302',
    'pending',
    128.00,
    'USD',
    '2026-06-12T09:20:00.000Z',
    null,
    '2026-06-12T09:20:00.000Z'
  ),
  (
    '6e16adfd-1e32-4a43-b6b0-b3d8fe17c694',
    'f9b5ba34-6642-4f8d-a74d-9260a4539c73',
    'processed',
    72.00,
    'USD',
    '2026-06-10T15:25:00.000Z',
    '2026-06-11T12:15:00.000Z',
    '2026-06-11T12:15:00.000Z'
  )
on conflict (id) do update set
  order_id = excluded.order_id,
  status = excluded.status,
  amount = excluded.amount,
  currency = excluded.currency,
  requested_at = excluded.requested_at,
  processed_at = excluded.processed_at,
  updated_at = excluded.updated_at;
