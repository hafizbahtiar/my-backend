import { stripeConfig } from './env';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/**
 * Get Stripe client instance (lazy initialization)
 * Returns null if Stripe is not configured
 */
export function getStripe(): Stripe | null {
  if (!stripeConfig.enabled) {
    return null;
  }

  if (!stripeClient && stripeConfig.secretKey) {
    stripeClient = new Stripe(stripeConfig.secretKey, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    });
  }

  return stripeClient;
}

/**
 * Get Stripe publishable key
 */
export function getStripePublishableKey(): string {
  return stripeConfig.publishableKey;
}

/**
 * Check if Stripe is enabled
 */
export function isStripeEnabled(): boolean {
  return stripeConfig.enabled;
}

