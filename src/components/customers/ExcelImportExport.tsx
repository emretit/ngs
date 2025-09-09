
import { useState } from 'react';
import ExcelActions from './excel/ExcelActions';
import ImportDialog from './excel/ImportDialog';
import type { Customer } from '@/types/customer';

interface ExcelImportExportProps {
  customers: Customer[];
}

const ExcelImportExport = ({ customers }: ExcelImportExportProps) => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  return (
    <>
      <ExcelActions 
        customers={customers} 
        onImportClick={() => setIsImportDialogOpen(true)} 
      />
      
      <ImportDialog 
        isOpen={isImportDialogOpen} 
        setIsOpen={setIsImportDialogOpen} 
      />
    </>
  );
};

export default ExcelImportExport;
