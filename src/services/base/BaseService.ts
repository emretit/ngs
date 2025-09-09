
import { supabase } from "@/integrations/supabase/client";

export interface ServiceOptions {
  pageSize?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export abstract class BaseService {
  protected supabase = supabase;
}
