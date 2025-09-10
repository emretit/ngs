export interface ServiceSlipData {
  id: string;
  service_request_id: string;
  slip_number: string;
  issue_date: string;
  completion_date?: string;
  technician_name: string;
  technician_signature?: string;
  customer: {
    name: string;
    company?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  equipment: {
    name?: string;
    model?: string;
    serial_number?: string;
    location?: string;
  };
  service_details: {
    problem_description: string;
    work_performed: string;
    parts_used: Array<{
      name: string;
      quantity: number;
      unit_price?: number;
    }>;
    service_type: string;
    warranty_status?: string;
  };
  status: 'draft' | 'completed' | 'signed';
  created_at: string;
  updated_at: string;
}

export interface ServiceSlipFormData {
  problem_description: string;
  work_performed: string;
  parts_used: Array<{
    name: string;
    quantity: number;
    unit_price?: number;
  }>;
  technician_signature?: string;
  completion_date?: string;
}

export interface ServiceSlipPdfOptions {
  templateId?: string;
  filename?: string;
  uploadToStorage?: boolean;
  storagePath?: string;
}