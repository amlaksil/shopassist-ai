import { Injectable } from '@nestjs/common';

import type { KnowledgeContext } from '../common/types/app.types';
import { DataStoreService } from '../supabase/data-store.service';

@Injectable()
export class KnowledgeBaseService {
  constructor(private readonly dataStoreService: DataStoreService) {}

  async findRelevantContext(message: string): Promise<KnowledgeContext> {
    const [faqs, products] = await Promise.all([
      this.dataStoreService.getFaqArticles(),
      this.dataStoreService.getProducts()
    ]);

    const keywords = this.tokenize(message);
    const rankedFaqs = this.rankItems(faqs, keywords, (faq) => [
      faq.question,
      faq.answer,
      faq.category,
      faq.keywords.join(' ')
    ]);
    const rankedProducts = this.rankItems(products, keywords, (product) => [
      product.name,
      product.description,
      product.category,
      product.sku,
      product.attributes.join(' ')
    ]);

    const topFaqs = rankedFaqs.slice(0, 3);
    const topProducts = rankedProducts.slice(0, 3);

    const summary = [
      ...topFaqs.map(
        (faq) => `FAQ [${faq.category}] ${faq.question}: ${faq.answer}`
      ),
      ...topProducts.map(
        (product) =>
          `Product [${product.category}] ${product.name} (${product.sku}) - ${product.description}. Price: ${product.currency} ${product.price}. Availability: ${product.inventory_status}.`
      )
    ].join('\n');

    return {
      faqs: topFaqs,
      products: topProducts,
      summary
    };
  }

  private tokenize(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2);
  }

  private rankItems<T>(
    items: T[],
    keywords: string[],
    textExtractor: (item: T) => string[]
  ): T[] {
    return items
      .map((item) => {
        const haystack = textExtractor(item).join(' ').toLowerCase();
        const score = keywords.reduce(
          (total, keyword) => (haystack.includes(keyword) ? total + 1 : total),
          0
        );

        return { item, score };
      })
      .sort((left, right) => right.score - left.score)
      .filter((entry, index) => entry.score > 0 || index < 2)
      .map((entry) => entry.item);
  }
}
