
// Define a Json type to be used in Supabase responses
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];
