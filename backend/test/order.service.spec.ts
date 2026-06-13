import { OrderService } from '../src/commerce/order.service';

describe('OrderService', () => {
  const recentDeliveryDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const olderDeliveryDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
  const processedRefundDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const dataStoreService = {
    getCustomers: jest.fn(),
    getOrders: jest.fn(),
    getOrderItems: jest.fn(),
    getShipments: jest.fn(),
    getReturns: jest.fn(),
    getRefunds: jest.fn()
  };

  let service: OrderService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new OrderService(dataStoreService as never);

    dataStoreService.getCustomers.mockResolvedValue([
      {
        id: 'customer-1',
        customer_code: 'CUST-1001',
        name: 'Hanna Bekele',
        email: 'hanna.bekele@example.com'
      },
      {
        id: 'customer-2',
        customer_code: 'CUST-1002',
        name: 'Naomi Rivera',
        email: 'naomi.rivera@example.com'
      }
    ]);
    dataStoreService.getOrders.mockResolvedValue([
      {
        id: 'order-1',
        order_number: 'ORD-1001',
        customer_id: 'customer-1',
        status: 'delivered',
        total_amount: 179,
        currency: 'USD',
        placed_at: '2026-06-03T10:25:00.000Z',
        shipping_address: '1450 West Lake St',
        created_at: '2026-06-03T10:25:00.000Z',
        updated_at: '2026-06-08T16:10:00.000Z'
      },
      {
        id: 'order-2',
        order_number: 'ORD-1005',
        customer_id: 'customer-2',
        status: 'delivered',
        total_amount: 149,
        currency: 'USD',
        placed_at: '2026-04-22T11:18:00.000Z',
        shipping_address: '490 Cedar Ave',
        created_at: '2026-04-22T11:18:00.000Z',
        updated_at: '2026-04-28T13:50:00.000Z'
      },
      {
        id: 'order-3',
        order_number: 'ORD-1006',
        customer_id: 'customer-2',
        status: 'delivered',
        total_amount: 72,
        currency: 'USD',
        placed_at: '2026-06-02T15:05:00.000Z',
        shipping_address: '490 Cedar Ave',
        created_at: '2026-06-02T15:05:00.000Z',
        updated_at: '2026-06-11T12:15:00.000Z'
      }
    ]);
    dataStoreService.getOrderItems.mockResolvedValue([
      {
        id: 'item-1',
        order_id: 'order-1',
        product_name: 'Atlas Wireless Headphones',
        sku: 'ATL-HDP-001',
        quantity: 1,
        unit_price: 179,
        currency: 'USD',
        created_at: '2026-06-03T10:25:00.000Z'
      },
      {
        id: 'item-2',
        order_id: 'order-2',
        product_name: 'Mira Ceramic Skincare Fridge',
        sku: 'MIR-BEA-305',
        quantity: 1,
        unit_price: 149,
        currency: 'USD',
        created_at: '2026-04-22T11:18:00.000Z'
      },
      {
        id: 'item-3',
        order_id: 'order-3',
        product_name: 'Luma Smart Desk Lamp',
        sku: 'LUM-LMP-210',
        quantity: 1,
        unit_price: 72,
        currency: 'USD',
        created_at: '2026-06-02T15:05:00.000Z'
      }
    ]);
    dataStoreService.getShipments.mockResolvedValue([
      {
        id: 'shipment-1',
        order_id: 'order-1',
        tracking_number: 'PP1001001',
        carrier: 'ParcelPath',
        status: 'delivered',
        latest_update: 'Delivered at front desk.',
        last_location: 'Chicago, IL',
        estimated_delivery_date: '2026-06-08',
        shipped_at: '2026-06-05T08:40:00.000Z',
        delivered_at: recentDeliveryDate,
        created_at: '2026-06-05T08:40:00.000Z',
        updated_at: '2026-06-08T16:10:00.000Z'
      },
      {
        id: 'shipment-2',
        order_id: 'order-2',
        tracking_number: 'RMX5017704',
        carrier: 'RapidMove',
        status: 'delivered',
        latest_update: 'Delivered to the front porch.',
        last_location: 'Denver, CO',
        estimated_delivery_date: '2026-04-28',
        shipped_at: '2026-04-24T09:15:00.000Z',
        delivered_at: olderDeliveryDate,
        created_at: '2026-04-24T09:15:00.000Z',
        updated_at: '2026-04-28T13:50:00.000Z'
      },
      {
        id: 'shipment-3',
        order_id: 'order-3',
        tracking_number: 'CNR2204819',
        carrier: 'CourierNorth',
        status: 'delivered',
        latest_update: 'Delivered to the mail room.',
        last_location: 'Denver, CO',
        estimated_delivery_date: '2026-06-07',
        shipped_at: '2026-06-04T10:40:00.000Z',
        delivered_at: recentDeliveryDate,
        created_at: '2026-06-04T10:40:00.000Z',
        updated_at: '2026-06-07T12:05:00.000Z'
      }
    ]);
    dataStoreService.getReturns.mockResolvedValue([
      {
        id: 'return-1',
        order_id: 'order-3',
        status: 'completed',
        reason: 'Lamp arrived damaged',
        requested_at: '2026-06-08T09:10:00.000Z',
        updated_at: '2026-06-10T15:25:00.000Z'
      }
    ]);
    dataStoreService.getRefunds.mockResolvedValue([
      {
        id: 'refund-1',
        order_id: 'order-3',
        status: 'processed',
        amount: 72,
        currency: 'USD',
        requested_at: '2026-06-10T15:25:00.000Z',
        processed_at: processedRefundDate,
        updated_at: '2026-06-11T12:15:00.000Z'
      }
    ]);
  });

  it('asks for an order number or checkout email when the request has no identifying details', async () => {
    const response = await service.handleTrackingIntent({
      message: 'Where is my order?',
      session_id: 'session-1'
    });

    expect(response?.status).toBe('clarification_needed');
    expect(response?.answer).toContain('order number or the email used at checkout');
  });

  it('returns delivered order details when the order number is provided', async () => {
    const response = await service.handleTrackingIntent({
      message: 'Where is my order ORD-1001?',
      session_id: 'session-2'
    });

    expect(response?.status).toBe('answered');
    expect(response?.answer).toContain('Order ORD-1001');
    expect(response?.answer).toContain('delivered');
  });

  it('asks for order details before checking a return request', async () => {
    const response = await service.handleTrackingIntent({
      message: 'Can I return this item?',
      session_id: 'session-3'
    });

    expect(response?.status).toBe('clarification_needed');
    expect(response?.category).toBe('return_help');
    expect(response?.answer).toContain('share your order number or the email used at checkout');
  });

  it('marks a recently delivered order as return eligible', async () => {
    const response = await service.handleTrackingIntent({
      message: 'Can I return order ORD-1001?',
      session_id: 'session-4'
    });

    expect(response?.status).toBe('answered');
    expect(response?.category).toBe('return_help');
    expect(response?.answer).toContain('appears eligible for a return');
  });

  it('flags when an order is outside the standard return window', async () => {
    const response = await service.handleTrackingIntent({
      message: 'Can I return order ORD-1005?',
      session_id: 'session-5'
    });

    expect(response?.status).toBe('ticket_required');
    expect(response?.category).toBe('return_help');
    expect(response?.ticket_context?.order_number).toBe('ORD-1005');
    expect(response?.answer).toContain('outside the standard return window');
  });

  it('returns processed refund details when a refund exists', async () => {
    const response = await service.handleTrackingIntent({
      message: 'Has my refund been processed for ORD-1006?',
      session_id: 'session-6'
    });

    expect(response?.status).toBe('answered');
    expect(response?.category).toBe('refund_request');
    expect(response?.answer).toContain('currently processed');
  });

  it('helps with delivered but missing packages', async () => {
    const response = await service.handleTrackingIntent({
      message: 'My order says delivered but I did not receive it. ORD-1001',
      session_id: 'session-7'
    });

    expect(response?.status).toBe('ticket_required');
    expect(response?.category).toBe('missing_delivery');
    expect(response?.suggested_customer?.email).toBe('hanna.bekele@example.com');
    expect(response?.answer).toContain('shows as delivered but is still missing');
  });

  it('escalates damaged-item issues with ticket context', async () => {
    const response = await service.handleTrackingIntent({
      message: 'My order arrived damaged. ORD-1006',
      session_id: 'session-8'
    });

    expect(response?.status).toBe('ticket_required');
    expect(response?.category).toBe('damaged_item');
    expect(response?.ticket_context?.order_number).toBe('ORD-1006');
    expect(response?.ticket_context?.priority).toBe('high');
  });
});
