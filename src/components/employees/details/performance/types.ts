
export interface PerformanceRecord {
  id: string;
  employee_id: string;
  review_period: string;
  reviewer_id: string;
  reviewer_name: string;
  technical_score: number;
  communication_score: number;
  teamwork_score: number;
  leadership_score: number;
  overall_score: number;
  strengths: string;
  areas_for_improvement: string;
  goals: string;
  notes: string;
  created_at: string;
}

export interface PerformanceFormValues {
  review_period: string;
  technical_score: number;
  communication_score: number;
  teamwork_score: number;
  leadership_score: number;
  strengths: string;
  areas_for_improvement: string;
  goals: string;
  notes: string;
}
