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

  console.log(`Seeded ${faqs.length} FAQ articles and ${products.length} products.`);
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
