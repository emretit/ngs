// Temporary fix for Supabase type issues
declare module "@supabase/supabase-js" {
  interface SelectQueryError<T> {
    [key: string]: any;
  }
  
  export interface User {
    id: string;
    [key: string]: any;
  }
  
  export interface Session {
    [key: string]: any;
  }
  
  export function createClient(url: string, key: string): any;
}