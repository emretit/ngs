
import React from "react";
import { Check, Clock, XCircle } from "lucide-react";
import { ProposalStatusShared } from "@/types/shared-types";

interface WorkflowStep {
  id: ProposalStatusShared;
  label: string;
  icon: React.ReactNode;
}

interface ProposalWorkflowProgressProps {
  currentStatus: ProposalStatusShared;
}

const ProposalWorkflowProgress = ({ currentStatus }: ProposalWorkflowProgressProps) => {
  // Define workflow steps
  const workflowSteps: WorkflowStep[] = [
    {
      id: "draft",
      label: "Taslak",
      icon: <div className="p-1.5 bg-gray-100 rounded-full"><Clock className="h-3 w-3 text-gray-500" /></div>
    },
    {
      id: "pending_approval",
      label: "Onay Bekliyor",
      icon: <div className="p-1.5 bg-amber-100 rounded-full"><Clock className="h-3 w-3 text-amber-500" /></div>
    },
    {
      id: "sent",
      label: "Gönderildi",
      icon: <div className="p-1.5 bg-blue-100 rounded-full"><Check className="h-3 w-3 text-blue-500" /></div>
    },
    {
      id: "accepted",
      label: "Kabul Edildi",
      icon: <div className="p-1.5 bg-green-100 rounded-full"><Check className="h-3 w-3 text-green-500" /></div>
    }
  ];

  // Alternative Turkish statuses mapping
  const statusMapping: Record<string, ProposalStatusShared> = {
    "hazirlaniyor": "draft",
    "onay_bekliyor": "pending_approval",
    "gonderildi": "sent"
  };

  // Map the current status if it's a Turkish variant
  const mappedStatus = statusMapping[currentStatus] || currentStatus;
  
  // Find the current step index
  const currentStepIndex = workflowSteps.findIndex(step => step.id === mappedStatus);
  
  // Special cases: Rejected or Expired
  if (currentStatus === "rejected" || currentStatus === "expired") {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg mt-4">
        <XCircle className="h-5 w-5 text-red-500 mr-2" />
        <span className="text-red-700 font-medium">
          {currentStatus === "rejected" ? "Teklif reddedildi" : "Teklif süresi doldu"}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        {workflowSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div className={`
                flex items-center justify-center h-8 w-8 rounded-full
                ${index <= currentStepIndex 
                  ? index === currentStepIndex 
                    ? 'bg-blue-500 text-white'
                    : 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-500'}
              `}>
                {index < currentStepIndex ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className={`
                text-xs mt-1 text-center
                ${index <= currentStepIndex 
                  ? index === currentStepIndex 
                    ? 'text-blue-700 font-medium' 
                    : 'text-green-700' 
                  : 'text-gray-500'}
              `}>
                {step.label}
              </span>
            </div>
            
            {/* Connector line between steps */}
            {index < workflowSteps.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-2
                ${index < currentStepIndex 
                  ? 'bg-green-500' 
                  : 'bg-gray-200'}
              `} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProposalWorkflowProgress;
