
import { CompanySettingsTab } from "./CompanySettingsTab";
import { useCompanies } from "@/hooks/useCompanies";

export const SystemSettings = () => {
  const { isLoading: companyLoading } = useCompanies();

  if (companyLoading) {
    return <div>Yükleniyor...</div>;
  }

  return <CompanySettingsTab />;
};
