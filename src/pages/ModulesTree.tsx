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
  const hasRoute = data.hasRoute;
  
  return (
    <div
      className={`
        px-6 py-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
        animate-fade-in hover-scale
        ${
          isRoot
            ? 'bg-gradient-to-br from-primary/20 via-primary/30 to-primary/40 border-primary font-bold text-primary shadow-2xl shadow-primary/30 animate-pulse'
            : isMainModule 
              ? 'bg-gradient-to-br from-accent/20 via-accent/30 to-accent/20 border-accent text-accent-foreground shadow-xl hover:shadow-2xl font-semibold hover:border-accent'
              : hasRoute
                ? 'bg-gradient-to-br from-card via-card/90 to-card/80 border-border text-card-foreground shadow-lg hover:shadow-xl hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10'
                : 'bg-gradient-to-br from-muted via-muted/80 to-muted/60 border-muted-foreground/20 text-muted-foreground shadow-md hover:shadow-lg opacity-75'
        } 
        ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105' : ''}
        ${hasRoute ? 'hover:text-primary' : ''}
      `}
      style={{ minWidth: '200px', textAlign: 'center' }}
    >
      <div className={`${isRoot ? 'text-xl' : isMainModule ? 'text-base' : 'text-sm'} font-medium transition-colors duration-200`}>
        {data.label}
      </div>
      {isRoot && (
        <div className="text-xs text-primary/70 mt-1 animate-fade-in">
          İş Yönetim Sistemi
        </div>
      )}
      {isMainModule && (
        <div className="text-xs text-accent/60 mt-1">
          Ana Modül
        </div>
      )}
      {hasRoute && !isRoot && !isMainModule && (
        <div className="text-xs text-muted-foreground/60 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Tıklayın →
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

  // Define edges with custom styling
  const initialEdges: Edge[] = [
    // Root to first level
    { 
      id: 'root-crm', 
      source: 'root', 
      target: 'crm',
      style: { stroke: 'hsl(var(--primary))', strokeWidth: 3 },
      animated: true
    },
    { 
      id: 'root-erp', 
      source: 'root', 
      target: 'erp',
      style: { stroke: 'hsl(var(--primary))', strokeWidth: 3 },
      animated: true
    },
    { 
      id: 'root-hr', 
      source: 'root', 
      target: 'hr',
      style: { stroke: 'hsl(var(--primary))', strokeWidth: 3 },
      animated: true
    },
    // CRM children
    { 
      id: 'crm-customers', 
      source: 'crm', 
      target: 'crm-customers',
      style: { stroke: 'hsl(var(--accent))', strokeWidth: 2 }
    },
    { 
      id: 'crm-opportunities', 
      source: 'crm', 
      target: 'crm-opportunities',
      style: { stroke: 'hsl(var(--accent))', strokeWidth: 2 }
    },
    { 
      id: 'crm-proposals', 
      source: 'crm', 
      target: 'crm-proposals',
      style: { stroke: 'hsl(var(--accent))', strokeWidth: 2 }
    },
    // ERP children
    { 
      id: 'erp-purchasing', 
      source: 'erp', 
      target: 'erp-purchasing',
      style: { stroke: 'hsl(var(--accent))', strokeWidth: 2 }
    },
    { 
      id: 'erp-inventory', 
      source: 'erp', 
      target: 'erp-inventory',
      style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '5,5' }
    },
    { 
      id: 'erp-cashflow', 
      source: 'erp', 
      target: 'erp-cashflow',
      style: { stroke: 'hsl(var(--accent))', strokeWidth: 2 }
    },
    // HR children
    { 
      id: 'hr-employees', 
      source: 'hr', 
      target: 'hr-employees',
      style: { stroke: 'hsl(var(--accent))', strokeWidth: 2 }
    },
    { 
      id: 'hr-leaves', 
      source: 'hr', 
      target: 'hr-leaves',
      style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '5,5' }
    },
    { 
      id: 'hr-payroll', 
      source: 'hr', 
      target: 'hr-payroll',
      style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '5,5' }
    },
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
      <div className="w-full bg-gradient-to-br from-background via-background to-muted/20 rounded-lg border border-border overflow-hidden shadow-xl" style={{ height: '75vh' }}>
        <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border shadow-lg">
          <h3 className="text-sm font-semibold text-foreground">Modül Ağacı</h3>
          <p className="text-xs text-muted-foreground">Tıklanabilir modüller mavi, geliştirilmekte olanlar gri</p>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
          className="animate-fade-in"
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