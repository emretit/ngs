import { useState } from "react";
import CashflowCategories from "./CashflowCategories";

const CashflowCategoriesWrapper = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <CashflowCategories 
      isCollapsed={isCollapsed} 
      setIsCollapsed={setIsCollapsed} 
    />
  );
};

export default CashflowCategoriesWrapper;
