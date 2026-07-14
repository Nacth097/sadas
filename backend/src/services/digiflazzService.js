import axios from 'axios';
import { env } from '../config/env.js';
import { publisherForSlug } from '../config/catalogMetadata.js';
import { sha256 } from '../utils/crypto.js';
import { AppError } from '../utils/errors.js';

const slugify = (value) =>
  String(value || 'uncategorized')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const normalizeBrand = (value) => String(value || '').trim().toUpperCase();

const isAllowedGameProduct = (item, allowedBrands) => {
  const brand = normalizeBrand(item.brand || item.category);
  const productName = normalizeBrand(item.product_name);
  return allowedBrands.some((allowed) => brand.includes(allowed) || productName.includes(allowed));
};

export class DigiflazzService {
  constructor(config = env.digiflazz, httpClient = axios) {
    this.config = config;
    this.httpClient = httpClient;
  }

  sign(command, refId = '') {
    return sha256(`${this.config.username}${this.config.apiKey}${refId || command}`);
  }

  async fetchProductList() {
    const response = await this.httpClient.post(`${this.config.baseUrl}/price-list`, {
      cmd: 'prepaid',
      username: this.config.username,
      sign: this.sign('pricelist')
    });
    const products = response.data?.data || [];
    if (!Array.isArray(products)) {
      throw new AppError(
        products.message || 'Invalid Digiflazz pricelist response',
        429,
        'DIGIFLAZZ_PRICELIST_UNAVAILABLE'
      );
    }
    return products;
  }

  async syncProducts(catalogRepository) {
    const products = await this.fetchProductList();
    const gameProducts = products.filter((item) =>
      isAllowedGameProduct(item, this.config.allowedGameBrands)
    );
    const margin = this.config.profitMarginPercent / 100;
    const syncedSlugs = new Set();

    for (const brand of this.config.allowedGameBrands) {
      const normalizedName = brand
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
      const categorySlug = slugify(brand);
      await catalogRepository.upsertCategory({
        name: normalizedName,
        slug: categorySlug,
        publisher: publisherForSlug(categorySlug),
        image_url: null
      });
      syncedSlugs.add(categorySlug);
    }

    for (const item of gameProducts) {
      const categoryName = item.brand || item.category || 'Uncategorized';
      const categorySlug = slugify(categoryName);
      const categoryId = await catalogRepository.upsertCategory({
        name: categoryName,
        slug: categorySlug,
        publisher: publisherForSlug(categorySlug),
        image_url: null
      });
      syncedSlugs.add(categorySlug);
      const buyerPrice = Number(item.price || item.buyer_price || 0);
      await catalogRepository.upsertProduct({
        category_id: categoryId,
        sku_code: item.buyer_sku_code,
        name: item.product_name,
        buyer_price: buyerPrice,
        seller_price: Math.ceil(buyerPrice * (1 + margin)),
        status: item.seller_product_status === false || item.buyer_product_status === false ? 'inactive' : 'active'
      });
    }

    const cleanup = await catalogRepository.deleteCategoriesExceptSlugs([...syncedSlugs]);

    return {
      synced: gameProducts.length,
      categories: syncedSlugs.size,
      skipped: products.length - gameProducts.length,
      deletedProducts: cleanup.deletedProducts,
      deletedCategories: cleanup.deletedCategories
    };
  }

  async validateCustomer(_skuCode, _customerNo) {
    return { supported: false, valid: true };
  }

  async orderPrepaid({ skuCode, customerNo, refId }) {
    const response = await this.httpClient.post(`${this.config.baseUrl}/transaction`, {
      username: this.config.username,
      buyer_sku_code: skuCode,
      customer_no: customerNo,
      ref_id: refId,
      sign: this.sign('transaction', refId)
    });

    const payload = response.data?.data || response.data;
    const status = String(payload?.status || '').toUpperCase();

    if (status === 'SUKSES' || status === 'SUCCESS') {
      return { status: 'success', serialNumber: payload.sn || payload.serial_number || null, raw: payload };
    }

    if (status === 'PENDING') {
      return { status: 'pending', serialNumber: null, raw: payload };
    }

    return {
      status: 'failed',
      message: payload?.message || payload?.rc || 'Digiflazz order failed',
      raw: payload
    };
  }
}
