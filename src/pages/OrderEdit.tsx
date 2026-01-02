import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { ShoppingCart, Save, Eye, FileDown, Send, MoreHorizontal, FileText, Package, Building2, Printer, Trash } from "lucide-react";
import { toast } from "sonner";
import { OrderStatus } from "@/types/orders";
import { useOrderEdit } from "@/hooks/useOrderEdit";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";
import ProposalPreviewModal from "@/components/proposals/form/ProposalPreviewModal";
import OrderCustomerInfoCard from "@/components/orders/cards/OrderCustomerInfoCard";
import ProductServiceCard from "@/components/proposals/cards/ProductServiceCard";
import FinancialSummaryCard from "@/components/proposals/cards/FinancialSummaryCard";
import TermsConditionsCard from "@/components/proposals/cards/TermsConditionsCard";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { orderStatusLabels, orderStatusColors } from "@/components/orders/cards/OrderDetailsCard";

// Constants
const DEFAULT_VAT_PERCENTAGE = 20;
const DEFAULT_CURRENCY = "TRY";
const DEFAULT_EXCHANGE_RATE = 1;
const DEFAULT_QUANTITY = 1;
const DEFAULT_UNIT = "adet";

interface LineItem {
  id: string;
  row_number: number;
  name?: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  tax_rate?: number;
  discount_rate?: number;
  total_price: number;
  currency?: string;
  product_id?: string;
  image_url?: string;
}

interface OrderEditProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const OrderEdit = ({ isCollapsed, setIsCollapsed }: OrderEditProps) => {
  const navigate = useNavigate();
  const { order, loading, saving, handleBack, handleSave, refetchOrder } = useOrderEdit();
  const { customers } = useCustomerSelect();
  
  // Form object for FormProvider
  const form = useForm({
    defaultValues: {
      customer_id: '',
      contact_name: '',
      employee_id: '',
    }
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItemData, setEditingItemData] = useState<any>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // Global discount state
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);
  
  // Track if order has been loaded
  const [orderLoaded, setOrderLoaded] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customer_id: "",
    contact_name: "",
    subject: "",
    order_date: new Date(),
    order_number: "",
    expected_delivery_date: undefined as Date | undefined,
    requested_date: undefined as Date | undefined,
    delivery_date: undefined as Date | undefined,
    shipment_date: undefined as Date | undefined,
    prepared_by: "",
    employee_id: "",
    notes: "",
    status: "pending" as OrderStatus,
    delivery_address: "",
    delivery_contact_name: "",
    delivery_contact_phone: "",
    payment_method: "Siparişle birlikte %50 avans, teslimde kalan tutar ödenecektir.",
    shipment_location: "",
    invoice_date: undefined as Date | undefined,
    invoice_number: "",
    is_cancelled: false,
    is_non_shippable: false,
    currency: DEFAULT_CURRENCY,
    exchange_rate: DEFAULT_EXCHANGE_RATE,
    vat_percentage: DEFAULT_VAT_PERCENTAGE,
    payment_terms: "Siparişle birlikte %50 avans, teslimde kalan tutar ödenecektir.",
    delivery_terms: "Teslimat süresi: Sipariş tarihinden itibaren 15-20 iş günü",
    warranty_terms: "Ürünlerimiz 2 yıl garantilidir.",
    price_terms: "",
    other_terms: "",
  });

  // Line items state
  const [items, setItems] = useState<LineItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when order loads
  useEffect(() => {
    if (order) {
      const initialCustomerId = order.customer_id || "";
      const initialContactName = order.customer?.name || "";
      const initialEmployeeId = order.employee_id || "";

      setFormData({
        customer_id: initialCustomerId,
        contact_name: initialContactName,
        subject: order.title || "",
        order_date: order.order_date ? new Date(order.order_date) : new Date(),
        order_number: order.order_number || "",
        expected_delivery_date: order.expected_delivery_date ? new Date(order.expected_delivery_date) : undefined,
        requested_date: undefined,
        delivery_date: order.delivery_date ? new Date(order.delivery_date) : undefined,
        shipment_date: undefined,
        prepared_by: initialEmployeeId,
        employee_id: initialEmployeeId,
        notes: order.notes || "",
        status: order.status,
        delivery_address: order.delivery_address || "",
        delivery_contact_name: order.delivery_contact_name || "",
        delivery_contact_phone: order.delivery_contact_phone || "",
        payment_method: order.payment_terms || "Siparişle birlikte %50 avans, teslimde kalan tutar ödenecektir.",
        shipment_location: "",
        invoice_date: undefined,
        invoice_number: "",
        is_cancelled: false,
        is_non_shippable: false,
        currency: order.currency || DEFAULT_CURRENCY,
        exchange_rate: DEFAULT_EXCHANGE_RATE,
        vat_percentage: DEFAULT_VAT_PERCENTAGE,
        payment_terms: order.payment_terms || "Siparişle birlikte %50 avans, teslimde kalan tutar ödenecektir.",
        delivery_terms: order.delivery_terms || "Teslimat süresi: Sipariş tarihinden itibaren 15-20 iş günü",
        warranty_terms: order.warranty_terms || "Ürünlerimiz 2 yıl garantilidir.",
        price_terms: order.price_terms || "",
        other_terms: order.other_terms || "",
      });

      // Update form context
      form.reset({
        customer_id: initialCustomerId,
        contact_name: initialContactName,
        employee_id: initialEmployeeId,
      });
      setOrderLoaded(true);

      // Initialize items from order
      if (order.items && order.items.length > 0) {
        const initialItems = order.items.map((item, index) => ({
          id: item.id || crypto.randomUUID(),
          row_number: index + 1,
          name: item.name || '',
          description: item.description || '',
          quantity: item.quantity,
          unit: item.unit || DEFAULT_UNIT,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          discount_rate: item.discount_rate || 0,
          total_price: item.unit_price * item.quantity,
          currency: item.currency || order.currency || DEFAULT_CURRENCY,
          product_id: item.product_id,
        }));
        setItems(initialItems);
      } else {
        setItems([{
          id: "1",
          row_number: 1,
          name: "",
          description: "",
          quantity: DEFAULT_QUANTITY,
          unit: DEFAULT_UNIT,
          unit_price: 0,
          total_price: 0,
          currency: order.currency || DEFAULT_CURRENCY
        }]);
      }
    }
  }, [order]);

  // Watch form context values
  const watchCustomerId = form.watch("customer_id");
  const watchContactName = form.watch("contact_name");
  const watchEmployeeId = form.watch("employee_id");

  // Sync form context changes to formData
  useEffect(() => {
    if (orderLoaded && watchCustomerId !== undefined && watchCustomerId !== formData.customer_id) {
      setFormData(prev => ({ ...prev, customer_id: watchCustomerId }));
      setHasChanges(true);
    }
  }, [watchCustomerId, orderLoaded]);

  useEffect(() => {
    if (orderLoaded && watchContactName !== undefined && watchContactName !== formData.contact_name) {
      setFormData(prev => ({ ...prev, contact_name: watchContactName }));
      setHasChanges(true);
    }
  }, [watchContactName, orderLoaded]);

  useEffect(() => {
    if (orderLoaded && watchEmployeeId !== undefined && watchEmployeeId !== formData.employee_id) {
      setFormData(prev => ({ ...prev, employee_id: watchEmployeeId, prepared_by: watchEmployeeId }));
      setHasChanges(true);
    }
  }, [watchEmployeeId, orderLoaded]);

  // Calculate totals by currency
  const calculationsByCurrency = useMemo(() => {
    const totals: Record<string, { gross: number; discount: number; net: number; vat: number; grand: number }> = {};

    const usedCurrencies = new Set<string>();
    items.forEach(item => {
      const currency = item.currency || 'TRY';
      usedCurrencies.add(currency);
    });

    usedCurrencies.forEach(currency => {
      totals[currency] = { gross: 0, discount: 0, net: 0, vat: 0, grand: 0 };
    });

    items.forEach(item => {
      const currency = item.currency || 'TRY';
      totals[currency].gross += item.quantity * item.unit_price;
    });

    const totalGross = Object.values(totals).reduce((sum, total) => sum + total.gross, 0);

    Object.keys(totals).forEach(currency => {
      const gross = totals[currency].gross;
      
      let globalDiscount = 0;
      if (globalDiscountValue > 0 && totalGross > 0) {
        const currencyProportion = gross / totalGross;
        if (globalDiscountType === 'percentage') {
          globalDiscount = (gross * globalDiscountValue) / 100;
        } else {
          globalDiscount = globalDiscountValue * currencyProportion;
        }
      }
      
      const net = gross - globalDiscount;
      const vat = (net * formData.vat_percentage) / 100;
      const grand = net + vat;
      
      totals[currency] = {
        gross,
        discount: globalDiscount,
        net,
        vat,
        grand
      };
    });

    return totals;
  }, [items, formData.vat_percentage, globalDiscountValue, globalDiscountType]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    if (value === undefined) return;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'customer_id') {
      form.setValue('customer_id', value);
    } else if (field === 'contact_name') {
      form.setValue('contact_name', value);
    } else if (field === 'employee_id') {
      form.setValue('employee_id', value);
    }
    setHasChanges(true);
  }, [form]);

  const handleItemChange = useCallback((index: number, field: keyof LineItem, value: any) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
        total_price: field === 'quantity' || field === 'unit_price'
          ? (field === 'quantity' ? value : updatedItems[index].quantity) *
            (field === 'unit_price' ? value : updatedItems[index].unit_price)
          : updatedItems[index].total_price
      };
      return updatedItems;
    });
    setHasChanges(true);
  }, []);

  const addItem = useCallback(() => {
    setItems(prevItems => {
      const newItem: LineItem = {
        id: Date.now().toString(),
        row_number: prevItems.length + 1,
        name: "",
        description: "",
        quantity: DEFAULT_QUANTITY,
        unit: DEFAULT_UNIT,
        unit_price: 0,
        total_price: 0,
        currency: formData.currency
      };
      return [...prevItems, newItem];
    });
    setHasChanges(true);
  }, [formData.currency]);

  const removeItem = useCallback((index: number) => {
    setItems(prevItems => {
      if (prevItems.length > 1) {
        const updatedItems = prevItems.filter((_, i) => i !== index);
        return updatedItems.map((item, i) => ({
          ...item,
          row_number: i + 1
        }));
      }
      return prevItems;
    });
    setHasChanges(true);
  }, []);

  const moveItemUp = useCallback((index: number) => {
    setItems(prevItems => {
      if (index > 0) {
        const updatedItems = [...prevItems];
        const [movedItem] = updatedItems.splice(index, 1);
        updatedItems.splice(index - 1, 0, movedItem);
        return updatedItems.map((item, i) => ({
          ...item,
          row_number: i + 1
        }));
      }
      return prevItems;
    });
    setHasChanges(true);
  }, []);

  const moveItemDown = useCallback((index: number) => {
    setItems(prevItems => {
      if (index < prevItems.length - 1) {
        const updatedItems = [...prevItems];
        const [movedItem] = updatedItems.splice(index, 1);
        updatedItems.splice(index + 1, 0, movedItem);
        return updatedItems.map((item, i) => ({
          ...item,
          row_number: i + 1
        }));
      }
      return prevItems;
    });
    setHasChanges(true);
  }, []);

  const handleProductModalSelect = (product: any, itemIndex?: number) => {
    setSelectedProduct(product);
    setEditingItemIndex(itemIndex);
    setProductModalOpen(true);
  };

  const handleAddProductToOrder = (productData: any, itemIndex?: number) => {
    if (itemIndex !== undefined) {
      const updatedItems = [...items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        name: productData.name,
        description: productData.description,
        quantity: productData.quantity,
        unit: productData.unit,
        unit_price: productData.unit_price,
        tax_rate: productData.vat_rate,
        discount_rate: productData.discount_rate,
        total_price: productData.total_price,
        currency: productData.currency || formData.currency,
        product_id: productData.product_id
      };
      setItems(updatedItems);
    } else {
      const newItem: LineItem = {
        id: Date.now().toString(),
        row_number: items.length + 1,
        name: productData.name,
        description: productData.description,
        quantity: productData.quantity,
        unit: productData.unit,
        unit_price: productData.unit_price,
        tax_rate: productData.vat_rate,
        discount_rate: productData.discount_rate,
        total_price: productData.total_price,
        currency: productData.currency || formData.currency,
        product_id: productData.product_id
      };
      setItems([...items, newItem]);
    }

    setProductModalOpen(false);
    setEditingItemIndex(undefined);
    setSelectedProduct(null);
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    const validItems = items.filter(item =>
      item.name?.trim() || item.description?.trim()
    );

    if (validItems.length === 0) {
      toast.error("En az bir sipariş kalemi eklenmelidir");
      return;
    }

    await handleSave({
      ...formData,
      items: validItems
    });
    
    setHasChanges(false);
  };

  const handlePreview = () => {
    setPreviewModalOpen(true);
  };

  const handleExportPDF = () => {
    toast.info("PDF export özelliği yakında eklenecek");
  };

  const handleSendEmail = () => {
    toast.info("E-posta gönderimi özelliği yakında eklenecek");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="w-8 h-8 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px]">
        <h2 className="text-xl font-semibold mb-2">Sipariş Bulunamadı</h2>
        <p className="text-muted-foreground mb-6">İstediğiniz sipariş mevcut değil veya erişim izniniz yok.</p>
        <Button onClick={handleBack}>Siparişler Sayfasına Dön</Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            <BackButton 
              onClick={() => navigate("/orders/list")}
              variant="ghost"
              size="sm"
            >
              Siparişler
            </BackButton>
            
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Sipariş Düzenle
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground/70">
                    {order.order_number || 'Sipariş #' + order.id}
                  </p>
                  <Badge className={`${orderStatusColors[order.status]} text-xs`}>
                    {orderStatusLabels[order.status]}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSaveChanges}
              disabled={saving || !hasChanges}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Kaydediliyor..." : hasChanges ? "Değişiklikleri Kaydet" : "Kaydedildi"}</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="font-medium">İşlemler</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handlePreview} className="gap-2 cursor-pointer">
                  <Eye className="h-4 w-4 text-slate-500" />
                  <span>Önizle</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                  <FileDown className="h-4 w-4 text-slate-500" />
                  <span>PDF İndir</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendEmail} className="gap-2 cursor-pointer">
                  <Send className="h-4 w-4 text-slate-500" />
                  <span>E-posta Gönder</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {formData.customer_id && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => navigate(`/customers/${formData.customer_id}`)}
                      className="gap-2 cursor-pointer"
                    >
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span>Müşteri Sayfasına Git</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-3">
        {/* Customer & Delivery Information */}
        <FormProvider {...form}>
          <OrderCustomerInfoCard
            formData={formData}
            handleFieldChange={handleFieldChange}
            errors={{}}
          />
        </FormProvider>

        {/* Products/Services Table */}
        <ProductServiceCard
          items={items}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onMoveItemUp={moveItemUp}
          onMoveItemDown={moveItemDown}
          onItemChange={handleItemChange}
          onProductModalSelect={(product, itemIndex) => {
            if (itemIndex !== undefined) {
              setSelectedProduct(null);
              setEditingItemIndex(itemIndex);
              setEditingItemData(product);
              setProductModalOpen(true);
            } else {
              handleProductModalSelect(product, itemIndex);
            }
          }}
          showMoveButtons={true}
          inputHeight="h-10"
        />

        {/* Terms and Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <TermsConditionsCard
              paymentTerms={formData.payment_terms}
              deliveryTerms={formData.delivery_terms}
              warrantyTerms={formData.warranty_terms}
              priceTerms={formData.price_terms}
              otherTerms={formData.other_terms}
              onInputChange={(e) => handleFieldChange(e.target.name, e.target.value)}
            />
          </div>
          <FinancialSummaryCard
            selectedCurrency={formData.currency}
            calculationsByCurrency={calculationsByCurrency}
            globalDiscountType={globalDiscountType}
            globalDiscountValue={globalDiscountValue}
            onGlobalDiscountTypeChange={(type) => {
              setGlobalDiscountType(type);
              setHasChanges(true);
            }}
            onGlobalDiscountValueChange={(value) => {
              setGlobalDiscountValue(value);
              setHasChanges(true);
            }}
            vatPercentage={formData.vat_percentage}
            onVatPercentageChange={(value) => {
              handleFieldChange('vat_percentage', value);
            }}
            showVatControl={true}
            inputHeight="h-10"
          />
        </div>

        {/* Product Details Modal */}
        <ProductDetailsModal
          open={productModalOpen}
          onOpenChange={(open) => {
            setProductModalOpen(open);
            if (!open) {
              setEditingItemIndex(undefined);
              setSelectedProduct(null);
              setEditingItemData(null);
            }
          }}
          product={selectedProduct}
          onAddToProposal={(productData) => handleAddProductToOrder(productData, editingItemIndex)}
          currency={formData.currency}
          existingData={editingItemData}
        />

        {/* Order Preview Modal */}
        <ProposalPreviewModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          formData={formData}
          items={items.map(item => ({
            ...item,
            name: item.name || 'Ürün',
            unit: item.unit || 'adet'
          }))}
          calculationsByCurrency={calculationsByCurrency}
          onExportPDF={handleExportPDF}
          onSendEmail={handleSendEmail}
        />
      </div>
    </div>
  );
};

export default OrderEdit;

