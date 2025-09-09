
export const useProposalCalculations = () => {
  const calculateTotals = (items: any[]) => {
    let subtotal = 0;
    
    items.forEach(item => {
      const unitPrice = item.unit_price || 0;
      const quantity = item.quantity || 0;
      const taxRate = item.tax_rate || 0;
      const discountRate = item.discount_rate || 0;
      
      // Apply discount
      const discountedUnitPrice = unitPrice * (1 - discountRate / 100);
      
      // Calculate item total with tax
      const itemTotal = discountedUnitPrice * quantity * (1 + (taxRate / 100));
      subtotal += itemTotal;
    });
    
    return subtotal;
  };

  const calculateSubtotal = (items: any[]) => {
    return items.reduce((sum, item) => {
      const unitPrice = item.unit_price || 0;
      const quantity = item.quantity || 0;
      const discountRate = item.discount_rate || 0;
      
      // Apply discount to unit price
      const discountedUnitPrice = unitPrice * (1 - discountRate / 100);
      
      // Subtotal without tax
      return sum + (discountedUnitPrice * quantity);
    }, 0);
  };

  const calculateTaxTotal = (items: any[]) => {
    return items.reduce((sum, item) => {
      const unitPrice = item.unit_price || 0;
      const quantity = item.quantity || 0;
      const taxRate = item.tax_rate || 0;
      const discountRate = item.discount_rate || 0;
      
      // Apply discount to unit price
      const discountedUnitPrice = unitPrice * (1 - discountRate / 100);
      
      // Calculate tax amount
      const itemSubtotal = discountedUnitPrice * quantity;
      const taxAmount = itemSubtotal * (taxRate / 100);
      
      return sum + taxAmount;
    }, 0);
  };

  const calculateDiscountTotal = (items: any[]) => {
    return items.reduce((sum, item) => {
      const unitPrice = item.unit_price || 0;
      const quantity = item.quantity || 0;
      const discountRate = item.discount_rate || 0;
      
      // Calculate discount amount
      const itemFullPrice = unitPrice * quantity;
      const discountAmount = itemFullPrice * (discountRate / 100);
      
      return sum + discountAmount;
    }, 0);
  };

  return {
    calculateTotals,
    calculateSubtotal,
    calculateTaxTotal,
    calculateDiscountTotal
  };
};
