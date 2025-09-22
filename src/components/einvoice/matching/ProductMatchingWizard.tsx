import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  FileText,
  Package,
  Target,
  Save,
  Eye
} from 'lucide-react';
import { ProductMatchingStep } from '@/types/einvoice';
import InvoiceDetailsStep from './steps/InvoiceDetailsStep';
import ProductMappingStep from './steps/ProductMappingStep';
import MatchingReviewStep from './steps/MatchingReviewStep';
import PurchaseInvoiceStep from './steps/PurchaseInvoiceStep';
import CompletionStep from './steps/CompletionStep';

const STEPS: ProductMatchingStep[] = [
  {
    step: 1,
    title: 'Fatura Detayları',
    description: 'Gelen fatura sütunlarını incele',
    completed: false
  },
  {
    step: 2,
    title: 'Ürün Eşleştirme',
    description: 'Ürünleri sistemdeki ürünlerle eşleştir',
    completed: false
  },
  {
    step: 3,
    title: 'Eşleştirme İnceleme',
    description: 'Eşleştirmeleri gözden geçir ve onayla',
    completed: false
  },
  {
    step: 4,
    title: 'Alış Faturası',
    description: 'Alış faturası oluştur',
    completed: false
  },
  {
    step: 5,
    title: 'Tamamlandı',
    description: 'İşlem başarıyla tamamlandı',
    completed: false
  }
];

export default function ProductMatchingWizard() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState(STEPS);
  const [isLoading, setIsLoading] = useState(false);

  const currentStepData = steps.find(step => step.step === currentStep);
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      // Mark current step as completed
      setSteps(prev => prev.map(step => 
        step.step === currentStep 
          ? { ...step, completed: true }
          : step
      ));
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate('/purchase/e-invoice');
    }
  };

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <InvoiceDetailsStep invoiceId={invoiceId} onNext={handleNext} />;
      case 2:
        return <ProductMappingStep invoiceId={invoiceId} onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <MatchingReviewStep invoiceId={invoiceId} onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <PurchaseInvoiceStep invoiceId={invoiceId} onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <CompletionStep invoiceId={invoiceId} onFinish={() => navigate('/purchase/e-invoice')} />;
      default:
        return null;
    }
  };

  const getStepIcon = (step: ProductMatchingStep) => {
    if (step.completed) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (step.step === currentStep) {
      return <Clock className="h-5 w-5 text-blue-600" />;
    } else {
      switch (step.step) {
        case 1: return <FileText className="h-5 w-5 text-gray-400" />;
        case 2: return <Target className="h-5 w-5 text-gray-400" />;
        case 3: return <Eye className="h-5 w-5 text-gray-400" />;
        case 4: return <Package className="h-5 w-5 text-gray-400" />;
        case 5: return <Save className="h-5 w-5 text-gray-400" />;
        default: return null;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/purchase/e-invoice')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              E-faturalar
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-semibold text-gray-900">Ürün Eşleştirme</h1>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Adım {currentStep} / {steps.length}: {currentStepData?.title}
              </span>
              <span className="text-sm text-gray-500">{Math.round(progress)}% tamamlandı</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <React.Fragment key={step.step}>
                <button
                  onClick={() => handleStepClick(step.step)}
                  disabled={step.step > currentStep}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                    step.step === currentStep
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : step.completed
                      ? 'bg-green-50 border-2 border-green-200 hover:bg-green-100'
                      : 'bg-gray-50 border-2 border-gray-200 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getStepIcon(step)}
                    <span className={`text-sm font-medium ${
                      step.step === currentStep
                        ? 'text-blue-700'
                        : step.completed
                        ? 'text-green-700'
                        : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 text-center max-w-32">
                    {step.description}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${
                    steps[index + 1].completed || steps[index + 1].step === currentStep
                      ? 'bg-blue-300'
                      : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-96">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}