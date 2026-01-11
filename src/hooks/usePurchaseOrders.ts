import { 
  usePurchaseOrdersList, 
  usePurchaseOrderDetail,
  usePurchaseOrdersInfiniteScroll as useInfiniteScroll
} from './purchase-orders/usePurchaseOrdersList';
import { 
  useCreatePurchaseOrder, 
  useUpdatePurchaseOrder,
  useUpdatePOStatus 
} from './purchase-orders/usePurchaseOrdersCRUD';
import { useRequestPOApproval } from './purchase-orders/usePurchaseOrdersApproval';

// Re-export types
export type { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  POFormData, 
  PurchaseOrderFilters 
} from './purchase-orders/types';

/**
 * Purchase Orders Hook (Facade)
 * 
 * Bu hook, satın alma siparişi işlemlerini tek bir interface'de toplar:
 * - usePurchaseOrdersList: Liste, filtreleme, infinite scroll, real-time
 * - usePurchaseOrdersCRUD: Create, update, status operations
 * - usePurchaseOrdersApproval: Onay işlemleri, PO numara üretimi
 * 
 * @example
 * // List usage
 * const { data: orders } = usePurchaseOrders({ status: 'draft' });
 * 
 * // Single order
 * const { data: order } = usePurchaseOrder(orderId);
 * 
 * // Infinite scroll
 * const { data, loadMore } = usePurchaseOrdersInfiniteScroll(filters);
 */

// Fetch all purchase orders
export const usePurchaseOrders = usePurchaseOrdersList;

// Fetch single purchase order
export const usePurchaseOrder = usePurchaseOrderDetail;

// Infinite scroll
export const usePurchaseOrdersInfiniteScroll = useInfiniteScroll;

// CRUD operations
export { useCreatePurchaseOrder, useUpdatePurchaseOrder, useUpdatePOStatus };

// Approval operations
export { useRequestPOApproval };
