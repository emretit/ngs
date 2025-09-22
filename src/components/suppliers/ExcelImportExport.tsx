import { useState } from 'react';
import ExcelActions from './excel/ExcelActions';
import ImportDialog from './excel/ImportDialog';
import type { Supplier } from '@/types/supplier';

interface ExcelImportExportProps {
  suppliers: Supplier[];
}

const ExcelImportExport = ({ suppliers }: ExcelImportExportProps) => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  return (
    <>
      <ExcelActions 
        suppliers={suppliers} 
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