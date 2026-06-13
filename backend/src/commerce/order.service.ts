import { Injectable, NotFoundException } from '@nestjs/common';

import type {
  ChatResponsePayload,
  CustomerInfo,
  CustomerRecord,
  OrderLookupPayload,
  OrderItemRecord,
  OrderRecord,
  PriorityLevel,
  RefundRecord,
  ReturnRecord,
  ShipmentRecord,
  TicketContextPayload
} from '../common/types/app.types';
import { DataStoreService } from '../supabase/data-store.service';

interface OrderTrackingContext {
  customer: CustomerRecord | null;
  order: OrderRecord;
  items: OrderItemRecord[];
  shipment: ShipmentRecord | null;
}

@Injectable()
export class OrderService {
  constructor(private readonly dataStoreService: DataStoreService) {}

  async handleTrackingIntent(input: {
    message: string;
    session_id: string;
    customer?: CustomerInfo;
    order_number?: string;
    checkout_email?: string;
  }): Promise<ChatResponsePayload | null> {
    const normalizedMessage = input.message.toLowerCase();
    const orderNumber = input.order_number ?? this.extractOrderNumber(input.message);
    const email =
      input.checkout_email ??
      this.extractEmail(input.message) ??
      input.customer?.email?.trim().toLowerCase();

    if (!this.isOrderHelpIntent(normalizedMessage)) {
      return null;
    }

    if (!orderNumber && !email) {
      return {
        session_id: input.session_id,
        answer: this.buildMissingOrderDetailsAnswer(normalizedMessage),
        status: 'clarification_needed',
        category: this.resolveOrderCategory(normalizedMessage),
        confidence: 'medium',
        provider: 'system',
        model: 'commerce-demo-v1'
      };
    }

    const context = await this.findOrderTrackingContext(orderNumber, email);

    if (!context) {
      return {
        session_id: input.session_id,
        answer:
          'I could not find a matching order with those details. Please double-check the order number or checkout email.',
        status: 'clarification_needed',
        category: 'orders',
        confidence: 'low',
        provider: 'system',
        model: 'commerce-demo-v1'
      };
    }

    if (Array.isArray(context)) {
      return {
        session_id: input.session_id,
        answer:
          `I found more than one recent order for ${email}. ` +
          `Please share the order number for the one you want to track: ${context
            .map((entry) => entry.order.order_number)
            .join(', ')}.`,
        status: 'clarification_needed',
        category: 'orders',
        confidence: 'medium',
        provider: 'system',
        model: 'commerce-demo-v1'
      };
    }

    if (this.isRefundIntent(normalizedMessage)) {
      return this.buildRefundResponse(input.session_id, context, input.customer);
    }

    if (
      this.isDelayedShipmentEscalationIntent(normalizedMessage, context.shipment?.status ?? null) ||
      this.isDeliveryIssueIntent(normalizedMessage) ||
      this.isDamageIntent(normalizedMessage)
    ) {
      return this.buildDeliveryIssueResponse(
        input.session_id,
        context,
        normalizedMessage,
        input.customer
      );
    }

    if (this.isReturnIntent(normalizedMessage)) {
      return this.buildReturnResponse(input.session_id, context, input.customer);
    }

    return {
      session_id: input.session_id,
      answer: this.buildTrackingAnswer(context),
      status: context.shipment?.status === 'exception' ? 'clarification_needed' : 'answered',
      category: 'orders',
      confidence: 'high',
      provider: 'system',
      model: 'commerce-demo-v1'
    };
  }

  async lookupOrderSummary(input: {
    orderNumber?: string;
    email?: string;
  }): Promise<OrderLookupPayload> {
    const context = await this.findOrderTrackingContext(
      input.orderNumber?.trim() || null,
      input.email?.trim().toLowerCase() || null
    );

    if (!context) {
      throw new NotFoundException('No matching order was found for those details.');
    }

    const selectedContext = Array.isArray(context) ? context[0] : context;

    return this.buildLookupPayload(
      selectedContext,
      Array.isArray(context)
        ? 'More than one order matched that email, so the most recent order is shown here.'
        : null
    );
  }

  private async findOrderTrackingContext(orderNumber?: string | null, email?: string | null) {
    const [customers, orders, orderItems, shipments, returns, refunds] = await Promise.all([
      this.dataStoreService.getCustomers(),
      this.dataStoreService.getOrders(),
      this.dataStoreService.getOrderItems(),
      this.dataStoreService.getShipments(),
      this.dataStoreService.getReturns(),
      this.dataStoreService.getRefunds()
    ]);

    if (orderNumber) {
      const order = orders.find(
        (entry) => entry.order_number.toLowerCase() === orderNumber.toLowerCase()
      );

      if (!order) {
        return null;
      }

      if (email) {
        const customer = customers.find((entry) => entry.id === order.customer_id) ?? null;
        if (customer && customer.email.toLowerCase() !== email.toLowerCase()) {
          return null;
        }
      }

      return this.buildContext(order, customers, orderItems, shipments, returns, refunds);
    }

    if (!email) {
      return null;
    }

    const customer = customers.find(
      (entry) => entry.email.toLowerCase() === email.toLowerCase()
    );

    if (!customer) {
      return null;
    }

    const matchingOrders = orders
      .filter((entry) => entry.customer_id === customer.id)
      .sort((left, right) => right.placed_at.localeCompare(left.placed_at));

    if (matchingOrders.length === 0) {
      return null;
    }

    if (matchingOrders.length > 1) {
      return matchingOrders.slice(0, 3).map((order) =>
        this.buildContext(order, customers, orderItems, shipments, returns, refunds)
      );
    }

    return this.buildContext(
      matchingOrders[0],
      customers,
      orderItems,
      shipments,
      returns,
      refunds
    );
  }

  private buildContext(
    order: OrderRecord,
    customers: CustomerRecord[],
    orderItems: OrderItemRecord[],
    shipments: ShipmentRecord[],
    returns: ReturnRecord[],
    refunds: RefundRecord[]
  ): OrderTrackingContext & { returnRecord: ReturnRecord | null; refundRecord: RefundRecord | null } {
    return {
      customer: customers.find((entry) => entry.id === order.customer_id) ?? null,
      order,
      items: orderItems.filter((entry) => entry.order_id === order.id),
      shipment: shipments.find((entry) => entry.order_id === order.id) ?? null,
      returnRecord: returns.find((entry) => entry.order_id === order.id) ?? null,
      refundRecord: refunds.find((entry) => entry.order_id === order.id) ?? null
    };
  }

  private buildLookupPayload(
    context: OrderTrackingContext & { returnRecord: ReturnRecord | null; refundRecord: RefundRecord | null },
    extraSummary: string | null
  ): OrderLookupPayload {
    const itemSummary =
      context.items.length > 0
        ? context.items
            .map((item) =>
              item.quantity > 1 ? `${item.quantity}x ${item.product_name}` : item.product_name
            )
            .join(', ')
        : 'your items';

    const shipmentStatus = context.shipment?.status ?? 'not_shipped';
    const latestUpdate = context.shipment?.latest_update ?? 'This order is still being prepared.';

    return {
      order_number: context.order.order_number,
      order_status: context.order.status,
      customer_name: context.customer?.name ?? null,
      customer_email: context.customer?.email ?? null,
      placed_at: context.order.placed_at,
      item_summary: itemSummary,
      shipment_status: shipmentStatus,
      carrier: context.shipment?.carrier ?? null,
      tracking_number: context.shipment?.tracking_number ?? null,
      latest_update: latestUpdate,
      last_location: context.shipment?.last_location ?? null,
      estimated_delivery_date: context.shipment?.estimated_delivery_date ?? null,
      delivered_at: context.shipment?.delivered_at ?? null,
      support_summary: extraSummary ?? this.buildTrackingAnswer(context)
    };
  }

  private buildTrackingAnswer(context: OrderTrackingContext) {
    const itemSummary =
      context.items.length > 0
        ? context.items
            .map((item) =>
              item.quantity > 1 ? `${item.quantity}x ${item.product_name}` : item.product_name
            )
            .join(', ')
        : 'your items';

    if (!context.shipment) {
      return (
        `Order ${context.order.order_number} for ${itemSummary} is currently ${context.order.status}. ` +
        'It is still being prepared, so tracking details are not available yet.'
      );
    }

    if (context.shipment.status === 'delivered') {
      return (
        `Order ${context.order.order_number} for ${itemSummary} was delivered via ` +
        `${context.shipment.carrier} on ${this.formatDate(context.shipment.delivered_at)}. ` +
        `Latest update: ${context.shipment.latest_update}`
      );
    }

    if (context.shipment.status === 'delayed') {
      return (
        `Order ${context.order.order_number} for ${itemSummary} is delayed with ${context.shipment.carrier}. ` +
        `Latest update: ${context.shipment.latest_update} ` +
        `${context.shipment.last_location ? `The most recent scan was in ${context.shipment.last_location}. ` : ''}` +
        `${context.shipment.estimated_delivery_date ? `The current estimated delivery date is ${this.formatDate(context.shipment.estimated_delivery_date)}.` : ''}`
      );
    }

    if (context.shipment.status === 'in_transit' || context.shipment.status === 'out_for_delivery') {
      return (
        `Order ${context.order.order_number} for ${itemSummary} is ${this.formatShipmentStatus(
          context.shipment.status
        )} with ${context.shipment.carrier}. ` +
        `Tracking number: ${context.shipment.tracking_number}. ` +
        `Latest update: ${context.shipment.latest_update} ` +
        `${context.shipment.last_location ? `Last scanned in ${context.shipment.last_location}. ` : ''}` +
        `${context.shipment.estimated_delivery_date ? `Estimated delivery: ${this.formatDate(context.shipment.estimated_delivery_date)}.` : ''}`
      );
    }

    return (
      `Order ${context.order.order_number} for ${itemSummary} is currently ${context.order.status}. ` +
      `Latest shipping update: ${context.shipment.latest_update}`
    );
  }

  private buildReturnResponse(
    sessionId: string,
    context: OrderTrackingContext & { returnRecord: ReturnRecord | null; refundRecord: RefundRecord | null },
    customer?: CustomerInfo
  ): ChatResponsePayload {
    if (context.returnRecord) {
      return {
        session_id: sessionId,
        answer:
          `A return has already been opened for order ${context.order.order_number}. ` +
          `The current return status is ${context.returnRecord.status}.`,
        status: 'answered',
        category: 'return_help',
        confidence: 'high',
        provider: 'system',
        model: 'commerce-demo-v1'
      };
    }

    if (!context.shipment?.delivered_at) {
      return {
        session_id: sessionId,
        answer:
          `Order ${context.order.order_number} has not been delivered yet, so a return cannot be started just yet. ` +
          'Once it arrives, I can help with the next step.',
        status: 'clarification_needed',
        category: 'return_help',
        confidence: 'medium',
        provider: 'system',
        model: 'commerce-demo-v1'
      };
    }

    const daysSinceDelivery = this.daysSince(context.shipment.delivered_at);
    if (daysSinceDelivery > 30) {
      return this.buildTicketRequiredResponse({
        sessionId,
        category: 'return_help',
        issueSummary:
          `Customer wants a return review for order ${context.order.order_number}, which appears to be outside the standard return window.`,
        answer:
          `Order ${context.order.order_number} was delivered more than 30 days ago, so it looks outside the standard return window. ` +
          'I can pass this to a support teammate for review if you want a manual exception check.',
        escalationReason: 'Outside the standard return window',
        priority: 'medium',
        customer,
        context
      });
    }

    return {
      session_id: sessionId,
      answer:
        `Order ${context.order.order_number} appears eligible for a return based on the delivery date. ` +
        'If you want, I can guide you through the return steps or help open a support request.',
      status: 'answered',
      category: 'return_help',
      confidence: 'high',
      provider: 'system',
      model: 'commerce-demo-v1'
    };
  }

  private buildRefundResponse(
    sessionId: string,
    context: OrderTrackingContext & { returnRecord: ReturnRecord | null; refundRecord: RefundRecord | null },
    customer?: CustomerInfo
  ): ChatResponsePayload {
    if (context.refundRecord) {
      const processedText = context.refundRecord.processed_at
        ? ` It was processed on ${this.formatDate(context.refundRecord.processed_at)}.`
        : '';

      return {
        session_id: sessionId,
        answer:
          `The refund for order ${context.order.order_number} is currently ${context.refundRecord.status}.${processedText}`,
        status: 'answered',
        category: 'refund_request',
        confidence: 'high',
        provider: 'system',
        model: 'commerce-demo-v1'
      };
    }

    if (context.returnRecord) {
      return {
        session_id: sessionId,
        answer:
          `There is no refund record yet for order ${context.order.order_number}. ` +
          `The return is currently ${context.returnRecord.status}, so the refund may not have been issued yet.`,
        status: 'clarification_needed',
        category: 'refund_request',
        confidence: 'medium',
        provider: 'system',
        model: 'commerce-demo-v1'
      };
    }

    return this.buildTicketRequiredResponse({
      sessionId,
      category: 'refund_request',
      issueSummary: `Customer wants refund help for order ${context.order.order_number}.`,
      answer:
        `I do not see a refund in progress for order ${context.order.order_number}. ` +
        'If you want refund help, I can pass this to a support teammate and include the order details.',
      escalationReason: 'Refund requested without an active refund record',
      priority: 'high',
      customer,
      context
    });
  }

  private isTrackingIntent(normalized: string) {
    return (
      normalized.includes('track my order') ||
      normalized.includes('where is my order') ||
      normalized.includes('track order') ||
      normalized.includes('order status') ||
      normalized.includes('shipping status') ||
      normalized.includes('where is my package') ||
      normalized.includes('where is my shipment')
    );
  }

  private isReturnIntent(normalized: string) {
    return (
      normalized.includes('return') ||
      normalized.includes('send it back') ||
      normalized.includes('return window') ||
      normalized.includes('exchange')
    );
  }

  private isRefundIntent(normalized: string) {
    return normalized.includes('refund') || normalized.includes('money back');
  }

  private isDamageIntent(normalized: string) {
    return (
      normalized.includes('damaged') ||
      normalized.includes('broken') ||
      normalized.includes('defective') ||
      normalized.includes('wrong item') ||
      normalized.includes('wrong product')
    );
  }

  private isWrongItemIntent(normalized: string) {
    return normalized.includes('wrong item') || normalized.includes('wrong product');
  }

  private isDeliveryIssueIntent(normalized: string) {
    return (
      normalized.includes('did not receive') ||
      normalized.includes("didn't receive") ||
      normalized.includes('not received') ||
      normalized.includes('missing package') ||
      normalized.includes('package missing') ||
      normalized.includes('says delivered') ||
      normalized.includes('never arrived') ||
      normalized.includes('missing order')
    );
  }

  private isShippingDelayIntent(normalized: string) {
    return (
      normalized.includes('delayed') ||
      normalized.includes('delay') ||
      normalized.includes('late shipment') ||
      normalized.includes('late delivery')
    );
  }

  private isOrderHelpIntent(normalized: string) {
    return (
      this.isTrackingIntent(normalized) ||
      this.isReturnIntent(normalized) ||
      this.isRefundIntent(normalized) ||
      this.isDamageIntent(normalized) ||
      this.isDeliveryIssueIntent(normalized) ||
      this.isShippingDelayIntent(normalized)
    );
  }

  private isComplaintTone(normalized: string) {
    return (
      normalized.includes('late') ||
      normalized.includes('delay') ||
      normalized.includes('delayed') ||
      normalized.includes('frustrat') ||
      normalized.includes('upset') ||
      normalized.includes('angry') ||
      normalized.includes('unacceptable') ||
      normalized.includes('human') ||
      normalized.includes('support teammate') ||
      normalized.includes('talk to support')
    );
  }

  private isDelayedShipmentEscalationIntent(
    normalized: string,
    shipmentStatus: ShipmentRecord['status'] | null
  ) {
    return shipmentStatus === 'delayed' && this.isComplaintTone(normalized);
  }

  private resolveOrderCategory(normalized: string) {
    if (this.isRefundIntent(normalized)) {
      return 'refund_request';
    }

    if (this.isWrongItemIntent(normalized)) {
      return 'wrong_item';
    }

    if (this.isDamageIntent(normalized)) {
      return 'damaged_item';
    }

    if (this.isReturnIntent(normalized)) {
      return 'return_help';
    }

    if (this.isDeliveryIssueIntent(normalized)) {
      return 'missing_delivery';
    }

    if (this.isShippingDelayIntent(normalized)) {
      return 'shipping_delay';
    }

    return 'orders';
  }

  private buildMissingOrderDetailsAnswer(normalized: string) {
    if (this.isRefundIntent(normalized)) {
      return 'I can check the refund status for you. Please share your order number or the email used at checkout.';
    }

    if (this.isReturnIntent(normalized) || this.isDamageIntent(normalized)) {
      return 'I can help with that return. Please share your order number or the email used at checkout first.';
    }

    if (this.isDeliveryIssueIntent(normalized)) {
      return 'I can help look into that delivery issue. Please share your order number or the email used at checkout.';
    }

    if (this.isShippingDelayIntent(normalized)) {
      return 'I can look into that shipment delay. Please share your order number or the email used at checkout.';
    }

    return 'I can help track that order. Please share your order number or the email used at checkout.';
  }

  private buildDeliveryIssueResponse(
    sessionId: string,
    context: OrderTrackingContext & { returnRecord: ReturnRecord | null; refundRecord: RefundRecord | null },
    normalizedMessage: string,
    customer?: CustomerInfo
  ): ChatResponsePayload {
    if (this.isDelayedShipmentEscalationIntent(normalizedMessage, context.shipment?.status ?? null)) {
      return this.buildTicketRequiredResponse({
        sessionId,
        category: 'shipping_delay',
        issueSummary:
          `Customer needs help with delayed shipment ${context.order.order_number}. ` +
          `${context.shipment?.latest_update ?? 'Delay reported by carrier.'}`,
        answer:
          `I’m sorry this shipment is delayed. Order ${context.order.order_number} is still with ${context.shipment?.carrier}, ` +
          'and I can pass this to a support teammate for follow-up if you want an update beyond the carrier scan.',
        escalationReason: 'Delayed shipment with customer complaint',
        priority: 'medium',
        customer,
        context
      });
    }

    if (this.isDeliveryIssueIntent(normalizedMessage)) {
      if (context.shipment?.status !== 'delivered') {
        return {
          session_id: sessionId,
          answer:
            `Order ${context.order.order_number} is not marked as delivered yet. ` +
            `${this.buildTrackingAnswer(context)} If the delivery status changes and you still cannot locate it, I can help with the next step.`,
          status: 'answered',
          category: 'orders',
          confidence: 'high',
          provider: 'system',
          model: 'commerce-demo-v1'
        };
      }

      return this.buildTicketRequiredResponse({
        sessionId,
        category: 'missing_delivery',
        issueSummary:
          `Customer reports order ${context.order.order_number} as delivered but still missing.`,
        answer:
          `I’m sorry that order ${context.order.order_number} shows as delivered but is still missing. ` +
          'Please check the delivery spot, front desk, or anyone else at the address who may have accepted it. ' +
          'If it is still missing, I can pass everything to a support teammate so you do not need to repeat yourself.',
        escalationReason: 'Delivered order reported missing',
        priority: 'high',
        customer,
        context
      });
    }

    if (!context.shipment?.delivered_at) {
      return {
        session_id: sessionId,
        answer:
          `Order ${context.order.order_number} has not been delivered yet. ` +
          'Once it arrives, I can help with a damage or wrong-item issue if you still need support.',
        status: 'clarification_needed',
        category: 'returns',
        confidence: 'medium',
        provider: 'system',
        model: 'commerce-demo-v1'
      };
    }

    return this.buildTicketRequiredResponse({
      sessionId,
      category: this.isWrongItemIntent(normalizedMessage) ? 'wrong_item' : 'damaged_item',
      issueSummary:
        `Customer reports a ${this.isWrongItemIntent(normalizedMessage) ? 'wrong item' : 'damaged item'} for order ${context.order.order_number}.`,
      answer:
        `I’m sorry about that issue with order ${context.order.order_number}. ` +
        'Because the item arrived damaged or incorrect, I can send this to a support teammate for review and keep your order details attached.',
      escalationReason: this.isWrongItemIntent(normalizedMessage)
        ? 'Customer received the wrong item'
        : 'Customer reported a damaged item',
      priority: 'high',
      customer,
      context
    });
  }

  private buildTicketRequiredResponse(input: {
    sessionId: string;
    category: string;
    issueSummary: string;
    answer: string;
    escalationReason: string;
    priority: PriorityLevel;
    customer?: CustomerInfo;
    context: OrderTrackingContext & { returnRecord: ReturnRecord | null; refundRecord: RefundRecord | null };
  }): ChatResponsePayload {
    const suggestedCustomer: Partial<CustomerInfo> = {
      email: input.context.customer?.email ?? undefined,
      issue_summary: input.issueSummary
    };
    const missingCustomerFields = this.getMissingCustomerFields(input.customer, suggestedCustomer);

    return {
      session_id: input.sessionId,
      answer: input.answer,
      status: 'ticket_required',
      category: input.category,
      confidence: 'medium',
      provider: 'system',
      model: 'commerce-demo-v1',
      requires_customer_details: missingCustomerFields.length > 0,
      missing_customer_fields: missingCustomerFields,
      suggested_customer: suggestedCustomer,
      ticket_context: this.buildTicketContext(input.context, input.escalationReason, input.priority)
    };
  }

  private buildTicketContext(
    context: OrderTrackingContext & { returnRecord: ReturnRecord | null; refundRecord: RefundRecord | null },
    escalationReason: string,
    priority: PriorityLevel
  ): TicketContextPayload {
    const summaryParts = [
      `Order ${context.order.order_number}`,
      `status ${context.order.status}`,
      context.shipment
        ? `${this.formatShipmentStatus(context.shipment.status)} with ${context.shipment.carrier}`
        : 'not yet shipped',
      context.shipment?.latest_update ?? null
    ].filter(Boolean);

    return {
      order_number: context.order.order_number,
      checkout_email: context.customer?.email ?? null,
      shipment_status: context.shipment?.status ?? 'not_shipped',
      escalation_reason: escalationReason,
      priority,
      timeline_summary: summaryParts.join(' · ')
    };
  }

  private getMissingCustomerFields(
    customer?: CustomerInfo,
    suggestedCustomer?: Partial<CustomerInfo>
  ): Array<keyof CustomerInfo> {
    const fields: Array<keyof CustomerInfo> = ['name', 'email', 'issue_summary'];

    return fields.filter((field) => {
      const value = customer?.[field] ?? suggestedCustomer?.[field];
      return !value || !value.trim();
    });
  }

  private extractOrderNumber(message: string) {
    const match = message.match(/\bORD-\d{4,}\b/i);
    return match ? match[0].toUpperCase() : null;
  }

  private extractEmail(message: string) {
    const match = message.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
    return match ? match[0].toLowerCase() : null;
  }

  private formatShipmentStatus(status: ShipmentRecord['status']) {
    return status.replaceAll('_', ' ');
  }

  private formatDate(value: string | null) {
    if (!value) {
      return 'soon';
    }

    return new Date(value).toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  }

  private daysSince(value: string) {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((Date.now() - new Date(value).getTime()) / msPerDay);
  }
}
