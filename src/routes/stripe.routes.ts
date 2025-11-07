import { Hono } from 'hono';
import { auth } from '../middleware/auth';
import { apiRateLimit, strictRateLimit } from '../middleware/rate-limit';
import {
  createPaymentIntent,
  getPaymentIntent,
  confirmPaymentIntent,
  cancelPaymentIntent,
  createCustomer,
  getCustomer,
  listPaymentMethods,
  attachPaymentMethod,
  detachPaymentMethod,
  createSetupIntent,
} from '../services/stripe.service';
import { createErrorResponse } from '../utils/errors';

const stripeRoutes = new Hono();

/**
 * POST /api/stripe/payment-intents
 * Create a new payment intent
 */
stripeRoutes.post('/payment-intents', auth, apiRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { amount, currency = 'usd', metadata, customerId } = body;

    if (!amount || typeof amount !== 'number') {
      return c.json(createErrorResponse('Amount is required and must be a number'), 400);
    }

    const paymentIntent = await createPaymentIntent(amount, currency, metadata, customerId);

    return c.json({
      success: true,
      data: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
    }, 201);
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), error.statusCode || 400);
  }
});

/**
 * GET /api/stripe/payment-intents/:id
 * Get a payment intent by ID
 */
stripeRoutes.get('/payment-intents/:id', auth, apiRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const paymentIntent = await getPaymentIntent(id);

    return c.json({
      success: true,
      data: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        metadata: paymentIntent.metadata,
        created: paymentIntent.created,
      },
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), error.statusCode || 404);
  }
});

/**
 * POST /api/stripe/payment-intents/:id/confirm
 * Confirm a payment intent
 */
stripeRoutes.post('/payment-intents/:id/confirm', auth, strictRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { paymentMethodId, returnUrl } = body;

    const paymentIntent = await confirmPaymentIntent(id, paymentMethodId, returnUrl);

    return c.json({
      success: true,
      data: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      },
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), error.statusCode || 400);
  }
});

/**
 * POST /api/stripe/payment-intents/:id/cancel
 * Cancel a payment intent
 */
stripeRoutes.post('/payment-intents/:id/cancel', auth, strictRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const paymentIntent = await cancelPaymentIntent(id);

    return c.json({
      success: true,
      data: {
        id: paymentIntent.id,
        status: paymentIntent.status,
      },
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), error.statusCode || 400);
  }
});

/**
 * POST /api/stripe/customers
 * Create a Stripe customer
 */
stripeRoutes.post('/customers', auth, apiRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { email, name, metadata } = body;

    if (!email) {
      return c.json(createErrorResponse('Email is required'), 400);
    }

    const customer = await createCustomer(email, name, metadata);

    return c.json({
      success: true,
      data: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        created: customer.created,
      },
    }, 201);
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), error.statusCode || 400);
  }
});

/**
 * GET /api/stripe/customers/:id
 * Get a customer by ID
 */
stripeRoutes.get('/customers/:id', auth, apiRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const customer = await getCustomer(id);

    return c.json({
      success: true,
      data: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        created: customer.created,
        metadata: customer.metadata,
      },
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), error.statusCode || 404);
  }
});

/**
 * GET /api/stripe/customers/:id/payment-methods
 * List payment methods for a customer
 */
stripeRoutes.get('/customers/:id/payment-methods', auth, apiRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const type = (c.req.query('type') as 'card' | 'us_bank_account') || 'card';

    const paymentMethods = await listPaymentMethods(id, type);

    return c.json({
      success: true,
      data: paymentMethods.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : undefined,
        created: pm.created,
      })),
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), error.statusCode || 400);
  }
});

/**
 * POST /api/stripe/payment-methods/:id/attach
 * Attach a payment method to a customer
 */
stripeRoutes.post('/payment-methods/:id/attach', auth, strictRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { customerId } = body;

    if (!customerId) {
      return c.json(createErrorResponse('Customer ID is required'), 400);
    }

    const paymentMethod = await attachPaymentMethod(id, customerId);

    return c.json({
      success: true,
      data: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        customer: paymentMethod.customer,
      },
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), error.statusCode || 400);
  }
});

/**
 * POST /api/stripe/payment-methods/:id/detach
 * Detach a payment method from a customer
 */
stripeRoutes.post('/payment-methods/:id/detach', auth, strictRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const paymentMethod = await detachPaymentMethod(id);

    return c.json({
      success: true,
      data: {
        id: paymentMethod.id,
        detached: true,
      },
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), error.statusCode || 400);
  }
});

/**
 * POST /api/stripe/setup-intents
 * Create a setup intent for saving payment methods
 */
stripeRoutes.post('/setup-intents', auth, apiRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { customerId, metadata } = body;

    if (!customerId) {
      return c.json(createErrorResponse('Customer ID is required'), 400);
    }

    const setupIntent = await createSetupIntent(customerId, metadata);

    return c.json({
      success: true,
      data: {
        id: setupIntent.id,
        clientSecret: setupIntent.client_secret,
        status: setupIntent.status,
        customer: setupIntent.customer,
      },
    }, 201);
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), error.statusCode || 400);
  }
});

export default stripeRoutes;

