import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import DefaultLayout from '@/components/layouts/DefaultLayout';
import { DatabaseSchemaFlow } from '@/components/modules/DatabaseSchemaFlow';

interface ModuleTreePageProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const ModuleTreePage: React.FC<ModuleTreePageProps> = ({ isCollapsed, setIsCollapsed }) => {
  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="Veritabanı Şeması"
      subtitle="Supabase tablolarının görsel şeması ve ilişkileri"
    >
      <div className="h-full" style={{ height: '80vh', minHeight: '600px', width: '100%' }}>
        <ReactFlowProvider>
          <DatabaseSchemaFlow />
        </ReactFlowProvider>
      </div>
    </DefaultLayout>
  );
};

export default ModuleTreePage;
