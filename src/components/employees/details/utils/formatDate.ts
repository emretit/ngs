
export const formatDate = (dateString?: string | null) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString('tr-TR');
  } catch (error) {
    return dateString;
  }
};
