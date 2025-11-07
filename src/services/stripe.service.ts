import { getStripe } from '../config/stripe';
import { NotFoundError, ValidationError } from '../utils/errors';
import Stripe from 'stripe';

/**
 * Stripe Service
 * 
 * Handles payment processing operations via Stripe
 */

/**
 * Check if Stripe is configured
 */
function ensureStripeEnabled(): Stripe {
  const stripe = getStripe();
  if (!stripe) {
    throw new NotFoundError('Stripe is not configured. Please set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY in your environment variables.');
  }
  return stripe;
}

/**
 * Create a payment intent
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>,
  customerId?: string
): Promise<Stripe.PaymentIntent> {
  if (amount <= 0) {
    throw new ValidationError('Amount must be greater than 0');
  }

  if (!currency || currency.length !== 3) {
    throw new ValidationError('Currency must be a valid 3-letter ISO code (e.g., usd, eur)');
  }

  const stripe = ensureStripeEnabled();

  const params: Stripe.PaymentIntentCreateParams = {
    amount: Math.round(amount * 100), // Convert to cents
    currency: currency.toLowerCase(),
    automatic_payment_methods: {
      enabled: true,
    },
    ...(metadata && { metadata }),
    ...(customerId && { customer: customerId }),
  };

  const paymentIntent = await stripe.paymentIntents.create(params);

  return paymentIntent;
}

/**
 * Get a payment intent by ID
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  if (!paymentIntentId) {
    throw new ValidationError('Payment intent ID is required');
  }

  const stripe = ensureStripeEnabled();

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error: any) {
    if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
      throw new NotFoundError('Payment intent not found');
    }
    throw error;
  }
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string,
  returnUrl?: string
): Promise<Stripe.PaymentIntent> {
  if (!paymentIntentId) {
    throw new ValidationError('Payment intent ID is required');
  }

  const stripe = ensureStripeEnabled();

  const params: Stripe.PaymentIntentConfirmParams = {
    ...(paymentMethodId && { payment_method: paymentMethodId }),
    ...(returnUrl && { return_url: returnUrl }),
  };

  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, params);
    return paymentIntent;
  } catch (error: any) {
    if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
      throw new NotFoundError('Payment intent not found');
    }
    throw error;
  }
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  if (!paymentIntentId) {
    throw new ValidationError('Payment intent ID is required');
  }

  const stripe = ensureStripeEnabled();

  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return paymentIntent;
  } catch (error: any) {
    if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
      throw new NotFoundError('Payment intent not found');
    }
    throw error;
  }
}

/**
 * Create a Stripe customer
 */
export async function createCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  if (!email || !email.includes('@')) {
    throw new ValidationError('Valid email is required');
  }

  const stripe = ensureStripeEnabled();

  const params: Stripe.CustomerCreateParams = {
    email,
    ...(name && { name }),
    ...(metadata && { metadata }),
  };

  const customer = await stripe.customers.create(params);

  return customer;
}

/**
 * Get a customer by ID
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer> {
  if (!customerId) {
    throw new ValidationError('Customer ID is required');
  }

  const stripe = ensureStripeEnabled();

  try {
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) {
      throw new NotFoundError('Customer has been deleted');
    }

    return customer as Stripe.Customer;
  } catch (error: any) {
    if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
      throw new NotFoundError('Customer not found');
    }
    throw error;
  }
}

/**
 * List payment methods for a customer
 */
export async function listPaymentMethods(
  customerId: string,
  type: 'card' | 'us_bank_account' = 'card'
): Promise<Stripe.PaymentMethod[]> {
  if (!customerId) {
    throw new ValidationError('Customer ID is required');
  }

  const stripe = ensureStripeEnabled();

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type,
  });

  return paymentMethods.data;
}

/**
 * Attach a payment method to a customer
 */
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> {
  if (!paymentMethodId) {
    throw new ValidationError('Payment method ID is required');
  }

  if (!customerId) {
    throw new ValidationError('Customer ID is required');
  }

  const stripe = ensureStripeEnabled();

  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    return paymentMethod;
  } catch (error: any) {
    if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
      throw new NotFoundError('Payment method or customer not found');
    }
    throw error;
  }
}

/**
 * Detach a payment method from a customer
 */
export async function detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
  if (!paymentMethodId) {
    throw new ValidationError('Payment method ID is required');
  }

  const stripe = ensureStripeEnabled();

  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    return paymentMethod;
  } catch (error: any) {
    if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
      throw new NotFoundError('Payment method not found');
    }
    throw error;
  }
}

/**
 * Create a setup intent for saving payment methods
 */
export async function createSetupIntent(
  customerId: string,
  metadata?: Record<string, string>
): Promise<Stripe.SetupIntent> {
  if (!customerId) {
    throw new ValidationError('Customer ID is required');
  }

  const stripe = ensureStripeEnabled();

  const params: Stripe.SetupIntentCreateParams = {
    customer: customerId,
    payment_method_types: ['card'],
    ...(metadata && { metadata }),
  };

  const setupIntent = await stripe.setupIntents.create(params);

  return setupIntent;
}

