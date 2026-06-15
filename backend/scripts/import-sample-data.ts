import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

interface FaqArticle {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  inventory_status: string;
  attributes: string[];
}

interface CustomerRecord {
  id: string;
  customer_code: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface OrderRecord {
  id: string;
  order_number: string;
  customer_id: string;
  status: string;
  total_amount: number;
  currency: string;
  placed_at: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
}

interface OrderItemRecord {
  id: string;
  order_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  currency: string;
  created_at: string;
}

interface ShipmentRecord {
  id: string;
  order_id: string;
  tracking_number: string;
  carrier: string;
  status: string;
  latest_update: string;
  last_location: string | null;
  estimated_delivery_date: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ReturnRecord {
  id: string;
  order_id: string;
  status: string;
  reason: string;
  requested_at: string;
  updated_at: string;
}

interface RefundRecord {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  currency: string;
  requested_at: string;
  processed_at: string | null;
  updated_at: string;
}

function resolveProjectRoot() {
  const direct = resolve(process.cwd(), 'data');
  if (existsSync(direct)) {
    return process.cwd();
  }

  return resolve(process.cwd(), '..');
}

function loadJsonFile<T>(relativePath: string): T {
  const filePath = join(resolveProjectRoot(), relativePath);
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

async function run() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to seed data.');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const faqs = loadJsonFile<FaqArticle[]>('data/faqs/faqs.json');
  const products = loadJsonFile<Product[]>('data/products/products.json');
  const customers = loadJsonFile<CustomerRecord[]>('data/commerce/customers.json');
  const orders = loadJsonFile<OrderRecord[]>('data/commerce/orders.json');
  const orderItems = loadJsonFile<OrderItemRecord[]>('data/commerce/order-items.json');
  const shipments = loadJsonFile<ShipmentRecord[]>('data/commerce/shipments.json');
  const returns = loadJsonFile<ReturnRecord[]>('data/commerce/returns.json');
  const refunds = loadJsonFile<RefundRecord[]>('data/commerce/refunds.json');

  const { error: faqError } = await supabase.from('faq_articles').upsert(faqs, {
    onConflict: 'id'
  });
  if (faqError) {
    throw new Error(`Unable to seed FAQ data: ${faqError.message}`);
  }

  const { error: productError } = await supabase.from('products').upsert(products, {
    onConflict: 'id'
  });
  if (productError) {
    throw new Error(`Unable to seed product data: ${productError.message}`);
  }

  const { error: customerError } = await supabase.from('customers').upsert(customers, {
    onConflict: 'id'
  });
  if (customerError) {
    throw new Error(`Unable to seed customer data: ${customerError.message}`);
  }

  const { error: orderError } = await supabase.from('orders').upsert(orders, {
    onConflict: 'id'
  });
  if (orderError) {
    throw new Error(`Unable to seed order data: ${orderError.message}`);
  }

  const { error: orderItemError } = await supabase.from('order_items').upsert(orderItems, {
    onConflict: 'id'
  });
  if (orderItemError) {
    throw new Error(`Unable to seed order item data: ${orderItemError.message}`);
  }

  const { error: shipmentError } = await supabase.from('shipments').upsert(shipments, {
    onConflict: 'id'
  });
  if (shipmentError) {
    throw new Error(`Unable to seed shipment data: ${shipmentError.message}`);
  }

  const { error: returnError } = await supabase.from('returns').upsert(returns, {
    onConflict: 'id'
  });
  if (returnError) {
    throw new Error(`Unable to seed return data: ${returnError.message}`);
  }

  const { error: refundError } = await supabase.from('refunds').upsert(refunds, {
    onConflict: 'id'
  });
  if (refundError) {
    throw new Error(`Unable to seed refund data: ${refundError.message}`);
  }

  console.log(
    `Seeded ${faqs.length} FAQ articles, ${products.length} products, ${customers.length} customers, ${orders.length} orders, ${shipments.length} shipments, ${returns.length} returns, and ${refunds.length} refunds.`
  );
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
