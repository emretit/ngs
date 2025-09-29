import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Background,
  Controls,
  MiniMap,
  NodeProps,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { layoutElements } from '@/lib/layout';
import DefaultLayout from '@/components/layouts/DefaultLayout';

// Custom node component
const CustomNode = ({ data, selected }: NodeProps) => {
  const isRoot = data.isRoot;
  const isMainModule = data.isMainModule;
  
  return (
    <div
      className={`px-6 py-4 rounded-xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
        isRoot
          ? 'bg-gradient-to-br from-primary/20 to-primary/30 border-primary font-bold text-primary shadow-xl shadow-primary/20'
          : isMainModule 
            ? 'bg-gradient-to-br from-card to-card/80 border-accent text-accent-foreground shadow-lg hover:shadow-xl font-semibold'
            : 'bg-card/90 border-border text-card-foreground shadow-md hover:shadow-lg hover:border-accent/50'
      } ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      style={{ minWidth: '200px', textAlign: 'center' }}
    >
      <div className={`${isRoot ? 'text-xl' : isMainModule ? 'text-base' : 'text-sm'} font-medium`}>
        {data.label}
      </div>
      {isRoot && (
        <div className="text-xs text-primary/70 mt-1">
          İş Yönetim Sistemi
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

interface ModulesTreeProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const ModulesTree: React.FC<ModulesTreeProps> = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  
  // Define node-to-route mapping
  const nodeRoutes: Record<string, string> = {
    'crm-customers': '/contacts',
    'crm-opportunities': '/opportunities',
    'crm-proposals': '/proposals',
    'erp-purchasing': '/purchase',
    'erp-cashflow': '/cashflow',
    'hr-employees': '/employees',
  };

  // Define nodes
  const initialNodes: Node[] = [
    {
      id: 'root',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Pafta.app', isRoot: true },
    },
    // First level children
    {
      id: 'crm',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'CRM', isRoot: false, isMainModule: true },
    },
    {
      id: 'erp',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'ERP', isRoot: false, isMainModule: true },
    },
    {
      id: 'hr',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'HR', isRoot: false, isMainModule: true },
    },
    // CRM children
    {
      id: 'crm-customers',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Müşteri Yönetimi', isRoot: false, hasRoute: true },
    },
    {
      id: 'crm-opportunities',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Fırsatlar', isRoot: false, hasRoute: true },
    },
    {
      id: 'crm-proposals',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Teklifler', isRoot: false, hasRoute: true },
    },
    // ERP children
    {
      id: 'erp-purchasing',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Satın Alma', isRoot: false, hasRoute: true },
    },
    {
      id: 'erp-inventory',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Stok/Depo', isRoot: false, hasRoute: false },
    },
    {
      id: 'erp-cashflow',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Nakit Akış', isRoot: false, hasRoute: true },
    },
    // HR children
    {
      id: 'hr-employees',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Çalışanlar', isRoot: false, hasRoute: true },
    },
    {
      id: 'hr-leaves',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'İzinler', isRoot: false, hasRoute: false },
    },
    {
      id: 'hr-payroll',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Bordro', isRoot: false, hasRoute: false },
    },
  ];

  // Define edges
  const initialEdges: Edge[] = [
    // Root to first level
    { id: 'root-crm', source: 'root', target: 'crm' },
    { id: 'root-erp', source: 'root', target: 'erp' },
    { id: 'root-hr', source: 'root', target: 'hr' },
    // CRM children
    { id: 'crm-customers', source: 'crm', target: 'crm-customers' },
    { id: 'crm-opportunities', source: 'crm', target: 'crm-opportunities' },
    { id: 'crm-proposals', source: 'crm', target: 'crm-proposals' },
    // ERP children
    { id: 'erp-purchasing', source: 'erp', target: 'erp-purchasing' },
    { id: 'erp-inventory', source: 'erp', target: 'erp-inventory' },
    { id: 'erp-cashflow', source: 'erp', target: 'erp-cashflow' },
    // HR children
    { id: 'hr-employees', source: 'hr', target: 'hr-employees' },
    { id: 'hr-leaves', source: 'hr', target: 'hr-leaves' },
    { id: 'hr-payroll', source: 'hr', target: 'hr-payroll' },
  ];

  // Apply dagre layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return layoutElements(initialNodes, initialEdges);
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node.id, node.data.label);
    
    // Navigate to the corresponding route if it exists
    if (nodeRoutes[node.id]) {
      navigate(nodeRoutes[node.id]);
    }
  }, [navigate]);

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="Modül Ağacı"
      subtitle="Pafta.app modülleri ve ilişkileri"
    >
      <div className="w-full bg-background rounded-lg border border-border overflow-hidden" style={{ height: '75vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1}
            style={{ 
              backgroundColor: 'hsl(var(--background))',
            }}
          />
          <Controls 
            position="top-left"
            style={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.data.isRoot) return 'hsl(var(--primary))';
              if (node.data.isMainModule) return 'hsl(var(--accent))';
              return 'hsl(var(--muted))';
            }}
            style={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            position="bottom-right"
          />
        </ReactFlow>
      </div>
    </DefaultLayout>
  );
};

export default ModulesTree;