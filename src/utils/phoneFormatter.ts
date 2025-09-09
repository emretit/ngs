/**
 * Formats Turkish phone numbers
 * Mobile: +90 5XX XXX XX XX
 * Office: +90 2XX XXX XX XX
 */

export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // If empty, return empty
  if (!digits) return '';
  
  // If starts with 90, remove it (we'll add +90 prefix)
  const cleanDigits = digits.startsWith('90') ? digits.slice(2) : digits;
  
  // If starts with 0, remove it
  const finalDigits = cleanDigits.startsWith('0') ? cleanDigits.slice(1) : cleanDigits;
  
  // Limit to 10 digits (Turkish phone numbers)
  const limitedDigits = finalDigits.slice(0, 10);
  
  if (!limitedDigits) return '';
  
  // Format based on length
  if (limitedDigits.length <= 3) {
    return `+90 ${limitedDigits}`;
  } else if (limitedDigits.length <= 6) {
    return `+90 ${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3)}`;
  } else if (limitedDigits.length <= 8) {
    return `+90 ${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3, 6)} ${limitedDigits.slice(6)}`;
  } else {
    return `+90 ${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3, 6)} ${limitedDigits.slice(6, 8)} ${limitedDigits.slice(8)}`;
  }
};

export const getDigitsOnly = (phoneNumber: string): string => {
  const digits = phoneNumber.replace(/\D/g, '');
  // If starts with 90, keep it as is for storage
  if (digits.startsWith('90')) {
    return digits;
  }
  // If it's a 10-digit number, add 90 prefix
  if (digits.length === 10) {
    return `90${digits}`;
  }
  return digits;
};
