
export interface ServiceMaterial {
  name: string;
  quantity: number;
  unit: string;
}

export interface ServiceActivity {
  id: string;
  activity_type: string;
  description: string;
  location: string;
  labor_hours: number;
  materials_used: ServiceMaterial[];
  start_time: string;
  status: string;
  performed_by?: string;
  employees?: {
    first_name: string;
    last_name: string;
  };
}
