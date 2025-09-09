
interface ParsedAuthError {
  errorCode: string | null;
  errorDescription: string | null;
}

/**
 * Parse error parameters from the URL hash
 */
export const parseAuthErrorFromUrl = (): ParsedAuthError => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const errorCode = hashParams.get("error_code");
  const errorDescription = hashParams.get("error_description");
  
  return { errorCode, errorDescription };
};

/**
 * Parse auth parameters from the URL hash
 */
export const parseAuthParamsFromUrl = () => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get("access_token");
  const type = hashParams.get("type");
  const { errorCode, errorDescription } = parseAuthErrorFromUrl();
  
  // Clear the URL without reloading the page
  window.history.replaceState({}, document.title, window.location.pathname);
  
  return {
    accessToken,
    type,
    errorCode,
    errorDescription
  };
};

/**
 * Get user-friendly error message for common auth errors
 */
export const getAuthErrorMessage = (errorCode: string | null, errorDescription: string | null): string => {
  if (!errorCode) return "";
  
  switch (errorCode) {
    case "otp_expired":
      return errorDescription || "Şifre sıfırlama bağlantısının süresi doldu. Lütfen yeni bir bağlantı isteyin.";
    case "access_denied":
      return errorDescription || "Erişim reddedildi. Yetkiniz yok veya bağlantı geçersiz.";
    default:
      return errorDescription || "Bir hata oluştu. Lütfen tekrar deneyin.";
  }
};
