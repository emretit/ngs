import React, { useCallback, useEffect, useState } from 'react';
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
  useReactFlow,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ModuleNode } from './ModuleNode';

const nodeTypes = {
  custom: ModuleNode,
};

interface ModuleFlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (node: Node) => void;
  className?: string;
}

export const ModuleFlow: React.FC<ModuleFlowProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeClick,
  className = "w-full h-full"
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView, getViewport, setViewport } = useReactFlow();
  
  // Update nodes and edges when props change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Persist viewport in localStorage
  useEffect(() => {
    const savedViewport = localStorage.getItem('module-tree-viewport');
    if (savedViewport) {
      try {
        const viewport = JSON.parse(savedViewport);
        setViewport(viewport);
      } catch (error) {
        console.warn('Failed to restore viewport:', error);
      }
    }
  }, [setViewport]);

  const handleViewportChange = useCallback(() => {
    const viewport = getViewport();
    localStorage.setItem('module-tree-viewport', JSON.stringify(viewport));
  }, [getViewport]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node.id, node.data.name);
    onNodeClick?.(node);
  }, [onNodeClick]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.1, duration: 800 });
  }, [fitView]);

  // Auto fit view when nodes change
  useEffect(() => {
    if (initialNodes.length > 0) {
      const timer = setTimeout(() => {
        handleFitView();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialNodes.length, handleFitView]);

  return (
    <div className={className}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onMoveEnd={handleViewportChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        className="bg-background"
        minZoom={0.2}
        maxZoom={2}
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="bg-background"
        />
        <Controls 
          position="top-left"
          className="bg-card border-border shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.kind === 'root') return 'hsl(var(--primary))';
            if (node.data.kind === 'group') return 'hsl(var(--muted-foreground))';
            return node.data.is_active ? 'hsl(var(--card-foreground))' : 'hsl(var(--muted))';
          }}
          className="bg-card border-border rounded-lg shadow-lg"
          position="bottom-right"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
};