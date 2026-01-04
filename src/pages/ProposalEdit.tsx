import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormProvider } from "react-hook-form";
import { useProposalEdit } from "@/hooks/useProposalEdit";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { ProposalItem } from "@/types/proposal";
import CustomerInfoCard from "@/components/proposals/cards/CustomerInfoCard";
import ProposalDetailsCard from "@/components/proposals/cards/ProposalDetailsCard";
import ProductServiceCard from "@/components/proposals/cards/ProductServiceCard";
import TermsConditionsCard from "@/components/proposals/cards/TermsConditionsCard";
import FinancialSummaryCard from "@/components/proposals/cards/FinancialSummaryCard";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";
import { ProposalEditHeader } from "@/pages/proposals/components/ProposalEditHeader";
import { ProposalEditDialogs } from "@/pages/proposals/components/ProposalEditDialogs";
import { useProposalForm } from "@/pages/proposals/hooks/useProposalForm";
import { useProposalCurrency } from "@/pages/proposals/hooks/useProposalCurrency";
import { useProposalItems } from "@/pages/proposals/hooks/useProposalItems";
import { useProposalRevisions } from "@/pages/proposals/hooks/useProposalRevisions";
import { useProposalActions } from "@/pages/proposals/hooks/useProposalActions";
import { calculateTotalsByCurrency, detectPrimaryCurrency } from "@/pages/proposals/utils/proposalEditHelpers";
import { PdfExportService } from "@/services/pdf/pdfExportService";

interface LineItem extends ProposalItem {
  row_number: number;
}

interface ProposalEditProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const ProposalEdit = ({ isCollapsed, setIsCollapsed }: ProposalEditProps) => {
  const { id } = useParams<{ id: string }>();
  const { proposal, loading, handleBack, handleSave, refetchProposal } = useProposalEdit();
  const { customers } = useCustomerSelect();
  const { exchangeRates: dashboardRates } = useExchangeRates();
  
  // Convert exchange rates to simple map format
  const exchangeRatesMap = useMemo(() => {
    const map: Record<string, number> = { TRY: 1 };
    dashboardRates.forEach(rate => {
      if (rate.currency_code && rate.forex_selling) {
        map[rate.currency_code] = rate.forex_selling;
      }
    });
    // Fallback values
    if (!map.USD) map.USD = 32.5;
    if (!map.EUR) map.EUR = 35.2;
    if (!map.GBP) map.GBP = 41.3;
    return map;
  }, [dashboardRates]);

  // Form state and initialization
  const {
    form,
    formData,
    setFormData,
    items,
    setItems,
    hasChanges,
    setHasChanges,
    globalDiscountType,
    setGlobalDiscountType,
    globalDiscountValue,
    setGlobalDiscountValue,
    proposalLoaded
  } = useProposalForm(proposal);

  // Currency management
  const {
    currencyConversionDialog,
    setCurrencyConversionDialog,
    handleCurrencyConversionConfirm,
    handleCurrencyConversionCancel,
    handleFieldChange: handleCurrencyFieldChange,
    prevCurrencyRef,
    prevExchangeRateRef
  } = useProposalCurrency(
    exchangeRatesMap,
    items,
    setItems,
    formData.currency,
    formData.exchange_rate
  );

  // Items management
  const {
    handleItemChange,
    addItem,
    removeItem,
    moveItemUp,
    moveItemDown
  } = useProposalItems(items, setItems, setHasChanges, formData.currency);

  // Revisions
  const { revisions } = useProposalRevisions(proposal?.id, proposal?.parent_proposal_id);

  // Calculate totals
  const calculationsByCurrency = useMemo(() => 
    calculateTotalsByCurrency(items, globalDiscountType, globalDiscountValue, formData.vat_percentage),
    [items, globalDiscountType, globalDiscountValue, formData.vat_percentage]
  );

  const primaryCurrency = useMemo(() => 
    detectPrimaryCurrency(calculationsByCurrency, formData.currency),
    [calculationsByCurrency, formData.currency]
  );

  const primaryTotals = calculationsByCurrency[primaryCurrency] || {
    gross: 0,
    discount: 0,
    net: 0,
    vat: 0,
    grand: 0
  };

  // Actions
  const actions = useProposalActions(
    proposal,
    formData,
    items,
    primaryTotals,
    primaryCurrency,
    customers || [],
    handleSave,
    refetchProposal,
    id
  );

  // Product modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItemData, setEditingItemData] = useState<any>(null);

  // Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const data = await PdfExportService.getTemplates('quote');
        setTemplates(data);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, []);

  // Update item calculations
  useEffect(() => {
    const updatedItems = items.map(item => ({
      ...item,
      total_price: item.quantity * item.unit_price
    }));
    setItems(updatedItems);
  }, [items.map(item => `${item.quantity}-${item.unit_price}`).join(','), setItems]);

  // Initialize currency refs when proposal loads
  useEffect(() => {
    if (proposal && proposalLoaded) {
      prevCurrencyRef.current = proposal.currency || "TRY";
      prevExchangeRateRef.current = proposal.exchange_rate;
    }
  }, [proposal, proposalLoaded, prevCurrencyRef, prevExchangeRateRef]);

  // Handle field change with currency conversion
  const handleFieldChange = (field: string, value: any) => {
    handleCurrencyFieldChange(field, value, formData, form, setFormData, setHasChanges);
  };

  // Handle product modal select
  const handleProductModalSelect = (product: any, itemIndex?: number) => {
    setSelectedProduct(product);
    setEditingItemIndex(itemIndex);
    if (product?.existingData) {
      setEditingItemData(product.existingData);
    } else {
      setEditingItemData(null);
    }
    setProductModalOpen(true);
  };

  // Handle add product to proposal
  const handleAddProductToProposal = (productData: any, itemIndex?: number) => {
    if (itemIndex !== undefined) {
      const updatedItems = [...items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        product_id: productData.id,
        name: productData.name,
        description: productData.description,
        quantity: productData.quantity,
        unit: productData.unit,
        unit_price: productData.unit_price,
        tax_rate: productData.vat_rate,
        discount_rate: productData.discount_rate,
        total_price: productData.total_price,
        currency: productData.currency || formData.currency,
      };
      setItems(updatedItems);
    } else {
      const newItem: LineItem = {
        id: Date.now().toString(),
        product_id: productData.id,
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
      };
      setItems([...items, newItem]);
    }
    
    setProductModalOpen(false);
    setEditingItemIndex(undefined);
    setSelectedProduct(null);
    setHasChanges(true);
  };

  const handlePreview = () => {
    toast.info("Önizleme özelliği yakında eklenecek");
  };

  const handleSmartSave = () => {
    actions.handleSaveChanges(proposal?.status || 'draft');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="w-8 h-8 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px]">
        <h2 className="text-xl font-semibold mb-2">Teklif Bulunamadı</h2>
        <p className="text-muted-foreground mb-6">İstediğiniz teklif mevcut değil veya erişim izniniz yok.</p>
        <Button onClick={handleBack}>Teklifler Sayfasına Dön</Button>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="space-y-2">
        <ProposalEditHeader
          proposal={proposal}
          proposalId={id}
          hasChanges={hasChanges}
          isSaving={actions.isSaving}
          revisions={revisions}
          templates={templates}
          formData={formData}
          onSave={handleSmartSave}
          onPdfPrint={actions.handlePdfPrint}
          onPreview={handlePreview}
          onSendEmail={actions.handleSendEmail}
          onSendToCustomer={actions.handleSendToCustomer}
          onSendForApproval={actions.handleSendForApproval}
          onConvertToDraft={actions.handleConvertToDraft}
          onAcceptProposal={actions.handleAcceptProposal}
          onRejectProposal={actions.handleRejectProposal}
          onCopySameCustomer={actions.handleCopySameCustomer}
          onCopyDifferentCustomer={actions.handleCopyDifferentCustomer}
          onCreateRevision={actions.handleCreateRevision}
          onConvertToOrder={actions.handleConvertToOrder}
          onConvertToInvoice={actions.handleConvertToInvoice}
          onDelete={actions.handleDeleteClick}
          isCopying={actions.isCopying}
        />

        <div className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <CustomerInfoCard
              formData={formData}
              handleFieldChange={handleFieldChange}
              errors={{}}
              form={form}
            />

            <ProposalDetailsCard
              formData={formData}
              handleFieldChange={handleFieldChange}
              errors={{}}
            />
          </div>

          <ProductServiceCard
            items={items}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onMoveItemUp={moveItemUp}
            onMoveItemDown={moveItemDown}
            onItemChange={handleItemChange}
            onProductModalSelect={(product, itemIndex) => {
              if (itemIndex !== undefined) {
                setSelectedProduct(product);
                setEditingItemIndex(itemIndex);
                
                if (product?.existingData && typeof product.existingData === 'object') {
                  const currentItem = items[itemIndex];
                  if (currentItem) {
                    setEditingItemData({
                      name: currentItem.name,
                      description: currentItem.description || "",
                      quantity: currentItem.quantity || 1,
                      unit: currentItem.unit || "adet",
                      unit_price: currentItem.unit_price || 0,
                      vat_rate: currentItem.tax_rate || 20,
                      discount_rate: currentItem.discount_rate || 0,
                      currency: currentItem.currency || formData.currency,
                      product_id: currentItem.product_id
                    });
                  } else {
                    setEditingItemData(product.existingData);
                  }
                } else {
                  setEditingItemData(null);
                }
                setProductModalOpen(true);
              } else {
                handleProductModalSelect(product, itemIndex);
              }
            }}
            showMoveButtons={true}
            inputHeight="h-8"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TermsConditionsCard
              paymentTerms={formData.payment_terms}
              deliveryTerms={formData.delivery_terms}
              warrantyTerms={formData.warranty_terms}
              priceTerms={formData.price_terms}
              otherTerms={formData.other_terms}
              onInputChange={(e) => handleFieldChange(e.target.name, e.target.value)}
            />

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
            onAddToProposal={(productData) => handleAddProductToProposal(productData, editingItemIndex)}
            currency={formData.currency}
            existingData={editingItemData}
          />

          <ProposalEditDialogs
            currencyConversionDialog={currencyConversionDialog}
            onCurrencyConversionConfirm={handleCurrencyConversionConfirm}
            onCurrencyConversionCancel={handleCurrencyConversionCancel}
            exchangeRatesMap={exchangeRatesMap}
            isDeleteDialogOpen={actions.isDeleteDialogOpen}
            onDeleteDialogOpenChange={actions.setIsDeleteDialogOpen}
            onDeleteConfirm={actions.handleDeleteConfirm}
            onDeleteCancel={actions.handleDeleteCancel}
            isDeleting={actions.isDeleting}
            isCustomerSelectDialogOpen={actions.isCustomerSelectDialogOpen}
            onCustomerSelectDialogOpenChange={actions.setIsCustomerSelectDialogOpen}
            selectedCustomerId={actions.selectedCustomerId}
            onSelectedCustomerIdChange={actions.setSelectedCustomerId}
            onConfirmCopyDifferentCustomer={actions.handleConfirmCopyDifferentCustomer}
            customers={customers || []}
            isCopying={actions.isCopying}
          />
        </div>
      </div>
    </FormProvider>
  );
};

export default ProposalEdit;
