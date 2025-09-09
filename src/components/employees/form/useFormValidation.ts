
import { formValidationSchema, EmployeeFormData } from "./types";

export const useFormValidation = () => {
  const validatePhoneNumber = (phone: string) => {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[\d\s+()-]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (data: EmployeeFormData): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    // Check required fields
    Object.entries(formValidationSchema).forEach(([field, rules]) => {
      if (rules.required && !data[field as keyof EmployeeFormData]) {
        errors[field] = rules.message;
      }
    });

    // Validate email format
    if (data.email && !validateEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Validate phone format if provided
    if (data.phone && !validatePhoneNumber(data.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  return {
    validatePhoneNumber,
    validateEmail,
    validateForm
  };
};
