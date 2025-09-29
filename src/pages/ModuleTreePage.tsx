import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import ProtectedLayout from '@/components/layouts/ProtectedLayout';
import { DatabaseSchemaFlow } from '@/components/modules/DatabaseSchemaFlow';
interface ModuleTreePageProps {
  
  
}
const ModuleTreePage: React.FC<ModuleTreePageProps> = ({ isCollapsed, setIsCollapsed }) => {
  return (
    <div className="h-full" style={{ height: '80vh', minHeight: '600px', width: '100%' }}>
        <ReactFlowProvider>
          <DatabaseSchemaFlow />
        </ReactFlowProvider>
      </div>
  );
};
export default ModuleTreePage;
