// Global type fix for Supabase SelectQueryError issues
declare global {
  interface SelectQueryError<T> {
    [key: string]: any;
  }
}

export {};