import axios from 'axios';
import { env } from '../config/env.js';
import { hmacSha256, safeEqual } from '../utils/crypto.js';
import { AppError } from '../utils/errors.js';

export class TripayService {
  constructor(config = env.tripay, httpClient = axios) {
    this.config = config;
    this.httpClient = httpClient;
  }

  callbackSignature(rawBody) {
    return hmacSha256(rawBody, this.config.privateKey);
  }

  verifyCallback(rawBody, signature) {
    // Timing-safe comparison prevents signature oracle attacks.
    return safeEqual(this.callbackSignature(rawBody), signature);
  }

  async createClosedInvoice(transaction, customer = {}) {
    const payload = {
      method: transaction.payment_method,
      merchant_ref: transaction.invoice_number,
      amount: Number(transaction.price),
      customer_name: customer.name || 'Guest Customer',
      customer_email: customer.email || 'guest@nacth.local',
      customer_phone: customer.phone || undefined,
      order_items: [
        {
          sku: transaction.sku_code,
          name: transaction.product_name,
          price: Number(transaction.price),
          quantity: 1
        }
      ],
      expired_time: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      signature: hmacSha256(
        `${this.config.merchantCode}${transaction.invoice_number}${Number(transaction.price)}`,
        this.config.privateKey
      )
    };

    try {
      const response = await this.httpClient.post(
        `${this.config.baseUrl}/transaction/create`,
        payload,
        { headers: { Authorization: `Bearer ${this.config.apiKey}` } }
      );

      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create TriPay invoice';
      throw new AppError(message, error.response?.status || 502, 'TRIPAY_CREATE_FAILED');
    }
  }

  async listPaymentChannels() {
    try {
      const response = await this.httpClient.get(`${this.config.baseUrl}/merchant/payment-channel`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` }
      });
      return response.data?.data || [];
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch TriPay payment channels';
      throw new AppError(message, error.response?.status || 502, 'TRIPAY_CHANNELS_FAILED');
    }
  }
}
