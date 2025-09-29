import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Fuse from 'fuse.js';
import { Node, Edge, MarkerType } from 'reactflow';
import { layoutElements } from './layout';

export interface Module {
  id: string;
  name: string;
  code?: string;
  kind: 'root' | 'group' | 'leaf';
  parent?: string;
  href?: string;
  icon?: string;
  color?: string;
  order_no: number;
  tags: string[];
  kpi_count: number;
  is_active: boolean;
  description?: string;
  company_id?: string;
}

export interface ModuleLink {
  source: string;
  target: string;
  label?: string;
  style?: Record<string, any>;
  company_id?: string;
}

export interface ModuleFilters {
  kind: string[];
  is_active: boolean | null;
  tags: string[];
}

export const useModuleData = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleLinks, setModuleLinks] = useState<ModuleLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ModuleFilters>({
    kind: [],
    is_active: null,
    tags: []
  });
  const [maxDepth, setMaxDepth] = useState(3);

  // Fetch data from Supabase
  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .order('order_no');

      if (modulesError) throw modulesError;

      // Fetch module links
      const { data: linksData, error: linksError } = await supabase
        .from('module_links')
        .select('*');

      if (linksError) throw linksError;

      setModules(modulesData || []);
      setModuleLinks(linksData || []);

      // If no data exists, seed demo data
      if (!modulesData || modulesData.length === 0) {
        await seedDemoData();
      }
    } catch (err: any) {
      console.error('Error fetching modules:', err);
      setError(err.message);
      // Fall back to demo data
      loadDemoData();
    } finally {
      setLoading(false);
    }
  };

  const seedDemoData = async () => {
    try {
      // First, get user's company context
      const { data: userContext } = await supabase
        .rpc('get_user_company_context');
      
      if (userContext && userContext.length > 0) {
        const companyId = userContext[0].company_id;
        
        // Call the seed function
        const { error } = await supabase
          .rpc('seed_demo_modules', { p_company_id: companyId });
        
        if (error) throw error;
        
        // Refetch data
        await fetchModules();
      }
    } catch (err) {
      console.error('Error seeding demo data:', err);
      loadDemoData();
    }
  };

  const loadDemoData = () => {
    // Fallback demo data if Supabase is not available
    const demoModules: Module[] = [
      {
        id: 'root',
        name: 'Pafta.app',
        code: 'PAFTA',
        kind: 'root',
        href: '/',
        icon: 'Building2',
        color: '#3b82f6',
        order_no: 0,
        tags: ['ana-sistem', 'yönetim'],
        kpi_count: 50,
        is_active: true,
        description: 'İş Yönetim Sistemi - Ana Platform'
      },
      {
        id: 'crm',
        name: 'CRM',
        code: 'CRM',
        kind: 'group',
        parent: 'root',
        icon: 'Users',
        color: '#10b981',
        order_no: 1,
        tags: ['müşteri', 'satış', 'ilişki'],
        kpi_count: 15,
        is_active: true,
        description: 'Müşteri İlişkileri Yönetimi'
      },
      {
        id: 'erp',
        name: 'ERP',
        code: 'ERP',
        kind: 'group',
        parent: 'root',
        icon: 'Package',
        color: '#f59e0b',
        order_no: 2,
        tags: ['kaynak', 'planlama', 'süreç'],
        kpi_count: 20,
        is_active: true,
        description: 'Kurumsal Kaynak Planlaması'
      },
      {
        id: 'hr',
        name: 'HR',
        code: 'HR',
        kind: 'group',
        parent: 'root',
        icon: 'UserCheck',
        color: '#8b5cf6',
        order_no: 3,
        tags: ['insan', 'kaynakları', 'personel'],
        kpi_count: 8,
        is_active: true,
        description: 'İnsan Kaynakları Yönetimi'
      },
      {
        id: 'crm-customers',
        name: 'Müşteri Yönetimi',
        code: 'CRM_CUST',
        kind: 'leaf',
        parent: 'crm',
        href: '/contacts',
        icon: 'Users2',
        color: '#10b981',
        order_no: 1,
        tags: ['müşteri', 'iletişim', 'yönetim'],
        kpi_count: 5,
        is_active: true,
        description: 'Müşteri bilgileri ve iletişim yönetimi'
      },
      {
        id: 'crm-opportunities',
        name: 'Fırsatlar',
        code: 'CRM_OPP',
        kind: 'leaf',
        parent: 'crm',
        href: '/opportunities',
        icon: 'Target',
        color: '#10b981',
        order_no: 2,
        tags: ['fırsat', 'satış', 'potansiyel'],
        kpi_count: 3,
        is_active: true,
        description: 'Satış fırsatları ve takibi'
      },
      {
        id: 'crm-proposals',
        name: 'Teklifler',
        code: 'CRM_PROP',
        kind: 'leaf',
        parent: 'crm',
        href: '/proposals',
        icon: 'FileText',
        color: '#10b981',
        order_no: 3,
        tags: ['teklif', 'öneri', 'dokuman'],
        kpi_count: 7,
        is_active: true,
        description: 'Teklif hazırlama ve yönetimi'
      },
      {
        id: 'erp-purchasing',
        name: 'Satın Alma',
        code: 'ERP_PURCH',
        kind: 'leaf',
        parent: 'erp',
        href: '/purchase',
        icon: 'ShoppingCart',
        color: '#f59e0b',
        order_no: 1,
        tags: ['satın', 'alma', 'tedarik'],
        kpi_count: 8,
        is_active: true,
        description: 'Tedarik ve satın alma süreçleri'
      },
      {
        id: 'erp-inventory',
        name: 'Stok/Depo',
        code: 'ERP_INV',
        kind: 'leaf',
        parent: 'erp',
        icon: 'Package2',
        color: '#f59e0b',
        order_no: 2,
        tags: ['stok', 'depo', 'envanter'],
        kpi_count: 0,
        is_active: false,
        description: 'Stok yönetimi ve depo operasyonları'
      },
      {
        id: 'erp-cashflow',
        name: 'Nakit Akış',
        code: 'ERP_CASH',
        kind: 'leaf',
        parent: 'erp',
        href: '/cashflow',
        icon: 'TrendingUp',
        color: '#f59e0b',
        order_no: 3,
        tags: ['nakit', 'akış', 'finans'],
        kpi_count: 12,
        is_active: true,
        description: 'Nakit akış yönetimi ve raporlaması'
      },
      {
        id: 'hr-employees',
        name: 'Çalışanlar',
        code: 'HR_EMP',
        kind: 'leaf',
        parent: 'hr',
        href: '/employees',
        icon: 'User',
        color: '#8b5cf6',
        order_no: 1,
        tags: ['çalışan', 'personel', 'kayıt'],
        kpi_count: 5,
        is_active: true,
        description: 'Personel bilgileri ve yönetimi'
      },
      {
        id: 'hr-leaves',
        name: 'İzinler',
        code: 'HR_LEAVE',
        kind: 'leaf',
        parent: 'hr',
        icon: 'Calendar',
        color: '#8b5cf6',
        order_no: 2,
        tags: ['izin', 'tatil', 'devamsızlık'],
        kpi_count: 0,
        is_active: false,
        description: 'İzin talepleri ve takibi'
      },
      {
        id: 'hr-payroll',
        name: 'Bordro',
        code: 'HR_PAY',
        kind: 'leaf',
        parent: 'hr',
        icon: 'CreditCard',
        color: '#8b5cf6',
        order_no: 3,
        tags: ['bordro', 'maaş', 'ödeme'],
        kpi_count: 0,
        is_active: false,
        description: 'Bordro ve maaş yönetimi'
      }
    ];

    const demoLinks: ModuleLink[] = [
      {
        source: 'crm-customers',
        target: 'erp-cashflow',
        label: 'Tahsilat',
        style: { stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5,5' }
      },
      {
        source: 'crm-proposals',
        target: 'erp-purchasing',
        label: 'Maliyet',
        style: { stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5,5' }
      },
      {
        source: 'hr-employees',
        target: 'erp-cashflow',
        label: 'Maaş',
        style: { stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5,5' }
      }
    ];

    setModules(demoModules);
    setModuleLinks(demoLinks);
  };

  // Create Fuse.js search index
  const fuse = useMemo(() => {
    return new Fuse(modules, {
      keys: ['name', 'code', 'tags', 'description'],
      threshold: 0.3,
      includeScore: true
    });
  }, [modules]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    modules.forEach(module => {
      module.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [modules]);

  // Build hierarchy and calculate depths
  const moduleHierarchy = useMemo(() => {
    const moduleMap = new Map<string, Module & { depth: number; children: string[] }>();
    
    // Initialize all modules with depth 0 and empty children
    modules.forEach(module => {
      moduleMap.set(module.id, { ...module, depth: 0, children: [] });
    });

    // Build parent-child relationships and calculate depths
    const calculateDepth = (moduleId: string, visited = new Set<string>()): number => {
      if (visited.has(moduleId)) return 0; // Prevent infinite recursion
      visited.add(moduleId);
      
      const module = moduleMap.get(moduleId);
      if (!module || !module.parent) return 0;
      
      const parentDepth = calculateDepth(module.parent, visited);
      module.depth = parentDepth + 1;
      
      // Add to parent's children list
      const parent = moduleMap.get(module.parent);
      if (parent && !parent.children.includes(moduleId)) {
        parent.children.push(moduleId);
      }
      
      return module.depth;
    };

    modules.forEach(module => calculateDepth(module.id));
    
    return moduleMap;
  }, [modules]);

  // Filter and search modules
  const filteredModules = useMemo(() => {
    let filtered = modules;

    // Apply search
    if (searchTerm.trim()) {
      const searchResults = fuse.search(searchTerm);
      const searchedIds = new Set(searchResults.map(result => result.item.id));
      
      // Include searched modules and their parents/children
      const expandedIds = new Set<string>();
      searchedIds.forEach(id => {
        expandedIds.add(id);
        const module = moduleHierarchy.get(id);
        if (module) {
          // Add parent chain
          let currentId = module.parent;
          while (currentId) {
            expandedIds.add(currentId);
            const parentModule = moduleHierarchy.get(currentId);
            currentId = parentModule?.parent;
          }
          // Add direct children
          module.children.forEach(childId => expandedIds.add(childId));
        }
      });
      
      filtered = modules.filter(module => expandedIds.has(module.id));
    }

    // Apply filters
    if (filters.kind.length > 0) {
      filtered = filtered.filter(module => filters.kind.includes(module.kind));
    }

    if (filters.is_active !== null) {
      filtered = filtered.filter(module => module.is_active === filters.is_active);
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter(module => 
        filters.tags.some(tag => module.tags.includes(tag))
      );
    }

    // Apply depth filter
    filtered = filtered.filter(module => {
      const moduleWithDepth = moduleHierarchy.get(module.id);
      return moduleWithDepth ? moduleWithDepth.depth <= maxDepth : true;
    });

    return filtered;
  }, [modules, searchTerm, filters, maxDepth, fuse, moduleHierarchy]);

  // Convert to ReactFlow nodes and edges
  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edgeSet = new Set<string>();
    const edgeArray: Edge[] = [];

    // Create nodes
    filteredModules.forEach(module => {
      const moduleWithDepth = moduleHierarchy.get(module.id);
      nodeMap.set(module.id, {
        id: module.id,
        type: 'custom',
        position: { x: 0, y: 0 }, // Will be set by layout
        data: {
          ...module,
          depth: moduleWithDepth?.depth || 0
        }
      });
    });

    // Create edges from parent relationships
    filteredModules.forEach(module => {
      if (module.parent && nodeMap.has(module.parent) && nodeMap.has(module.id)) {
        const edgeId = `${module.parent}-${module.id}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          edgeArray.push({
            id: edgeId,
            source: module.parent,
            target: module.id,
            type: 'smoothstep',
            style: { stroke: 'hsl(var(--border))', strokeWidth: 2 },
            markerEnd: { type: MarkerType.Arrow, color: 'hsl(var(--border))' }
          });
        }
      }
    });

    // Add custom module links
    moduleLinks.forEach(link => {
      if (nodeMap.has(link.source) && nodeMap.has(link.target)) {
        const edgeId = `link-${link.source}-${link.target}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          edgeArray.push({
            id: edgeId,
            source: link.source,
            target: link.target,
            type: 'smoothstep',
            label: link.label,
            style: {
              stroke: link.style?.stroke || 'hsl(var(--primary))',
              strokeWidth: link.style?.strokeWidth || 2,
              strokeDasharray: link.style?.strokeDasharray || undefined
            },
            markerEnd: { type: MarkerType.Arrow, color: link.style?.stroke || 'hsl(var(--primary))' },
            animated: true
          });
        }
      }
    });

    // Apply layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutElements(
      Array.from(nodeMap.values()),
      edgeArray,
      'TB'
    );

    return { nodes: layoutedNodes, edges: layoutedEdges };
  }, [filteredModules, moduleLinks, moduleHierarchy]);

  // Get breadcrumbs for a module
  const getBreadcrumbs = (moduleId: string): Module[] => {
    const breadcrumbs: Module[] = [];
    let currentId: string | undefined = moduleId;
    
    while (currentId) {
      const module = modules.find(m => m.id === currentId);
      if (module) {
        breadcrumbs.unshift(module);
        currentId = module.parent;
      } else {
        break;
      }
    }
    
    return breadcrumbs;
  };

  return {
    modules,
    moduleLinks,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    maxDepth,
    setMaxDepth,
    nodes,
    edges,
    allTags,
    getBreadcrumbs,
    refetch: fetchModules
  };
};