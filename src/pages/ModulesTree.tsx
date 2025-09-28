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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { layoutElements } from '@/lib/layout';
import DefaultLayout from '@/components/layouts/DefaultLayout';

// Custom node component
const CustomNode = ({ data, selected }: NodeProps) => {
  const isRoot = data.isRoot;
  
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
        isRoot
          ? 'bg-muted border-primary font-bold text-foreground shadow-lg'
          : 'bg-card border-border text-card-foreground shadow-md hover:shadow-lg'
      } ${selected ? 'border-primary' : ''}`}
      style={{ minWidth: '180px', textAlign: 'center' }}
    >
      <div className={`${isRoot ? 'text-lg' : 'text-sm'}`}>
        {data.label}
      </div>
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
      data: { label: 'CRM', isRoot: false },
    },
    {
      id: 'erp',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'ERP', isRoot: false },
    },
    {
      id: 'hr',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'HR', isRoot: false },
    },
    // CRM children
    {
      id: 'crm-customers',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Müşteri Yönetimi', isRoot: false },
    },
    {
      id: 'crm-opportunities',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Fırsatlar', isRoot: false },
    },
    {
      id: 'crm-proposals',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Teklifler', isRoot: false },
    },
    // ERP children
    {
      id: 'erp-purchasing',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Satın Alma', isRoot: false },
    },
    {
      id: 'erp-inventory',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Stok/Depo', isRoot: false },
    },
    {
      id: 'erp-cashflow',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Nakit Akış', isRoot: false },
    },
    // HR children
    {
      id: 'hr-employees',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Çalışanlar', isRoot: false },
    },
    {
      id: 'hr-leaves',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'İzinler', isRoot: false },
    },
    {
      id: 'hr-payroll',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { label: 'Bordro', isRoot: false },
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
  }, []);

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
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              return node.data.isRoot ? '#D32F2F' : '#F5F5F5';
            }}
            style={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
            }}
          />
        </ReactFlow>
      </div>
    </DefaultLayout>
  );
};

export default ModulesTree;