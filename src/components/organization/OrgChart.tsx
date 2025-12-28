import React, { useMemo, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User, Building2, Mail, Briefcase, Users, Loader2, Crown,
  LayoutGrid, List, Network, ZoomIn, ZoomOut, Download,
  Maximize2, Minimize2, RotateCcw, Table as TableIcon,
  ChevronDown, ChevronRight, ArrowUpDown, Eye, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ViewMode = 'tree' | 'list' | 'grid' | 'hierarchy' | 'table';
type SortField = 'name' | 'position' | 'department' | 'email' | 'status';
type SortOrder = 'asc' | 'desc';

interface EmployeeNode {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  position?: string;
  department?: string;
  department_id?: string | null;
  manager_id?: string | null;
  status?: string;
  children?: EmployeeNode[];
  avatar_url?: string | null;
}

interface DepartmentNode {
  id: string;
  name: string;
  description?: string | null;
  head_id?: string | null;
  head?: EmployeeNode | null;
  employees: EmployeeNode[];
  parent_id?: string | null;
  children?: DepartmentNode[];
}

interface OrgChartProps {
  searchQuery?: string;
  selectedDepartment?: string;
  selectedStatus?: string;
  selectedPosition?: string;
}

export const OrgChart: React.FC<OrgChartProps> = ({
  searchQuery = "",
  selectedDepartment = "all",
  selectedStatus = "all",
  selectedPosition = "all"
}) => {
  const { companyId } = useCompany();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Fetch departments with parent_id for hierarchy
  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["org-chart-departments", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("departments")
        .select("id, name, description, head_id, parent_id")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name");

      if (error) throw error;
      return data as DepartmentNode[];
    },
    enabled: !!companyId,
  });

  // Fetch employees with department_id if available
  const { data: allEmployees = [], isLoading: isLoadingEmps } = useQuery({
    queryKey: ["org-chart-employees", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      // Try to get department_id if it exists in the schema
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, position, department, manager_id, status, avatar_url")
        .eq("company_id", companyId)
        .order("first_name");

      if (error) throw error;
      return data as EmployeeNode[];
    },
    enabled: !!companyId,
  });

  // Filter employees based on search and status
  const employees = useMemo(() => {
    let filtered = allEmployees;

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(emp => emp.status === selectedStatus);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(emp => 
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(query) ||
        emp.position?.toLowerCase().includes(query) ||
        emp.department?.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query)
      );
    }

    // Position filter
    if (selectedPosition !== "all") {
      filtered = filtered.filter(emp => emp.position === selectedPosition);
    }

    return filtered;
  }, [allEmployees, searchQuery, selectedStatus, selectedPosition]);

  const isLoading = isLoadingDepts || isLoadingEmps;

  // Build complete organization hierarchy
  const orgStructure = useMemo(() => {
    // Filter departments if selected
    let filteredDepartments = departments;
    if (selectedDepartment !== "all") {
      filteredDepartments = departments.filter(dept => dept.id === selectedDepartment);
    }

    // Also filter by search query for departments
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredDepartments = filteredDepartments.filter(dept => 
        dept.name.toLowerCase().includes(query) ||
        dept.description?.toLowerCase().includes(query)
      );
    }

    if (!filteredDepartments.length && !employees.length) return [];

    // Group employees by department name
    const employeesByDept = new Map<string, EmployeeNode[]>();
    const employeesWithoutDept: EmployeeNode[] = [];
    const deptNameMap = new Map<string, string>();

    filteredDepartments.forEach((dept) => {
      deptNameMap.set(dept.name.toLowerCase(), dept.id);
    });

    employees.forEach((emp) => {
      if (emp.department) {
        const deptId = deptNameMap.get(emp.department.toLowerCase());
        if (deptId) {
          if (!employeesByDept.has(deptId)) {
            employeesByDept.set(deptId, []);
          }
          employeesByDept.get(deptId)!.push(emp);
        } else {
          employeesWithoutDept.push(emp);
        }
      } else {
        employeesWithoutDept.push(emp);
      }
    });

    // Build employee hierarchy within each department
    const buildEmployeeTree = (emps: EmployeeNode[]): EmployeeNode[] => {
      const employeeMap = new Map<string, EmployeeNode>();
      const roots: EmployeeNode[] = [];

      // First pass: create all nodes
      emps.forEach((emp) => {
        employeeMap.set(emp.id, { ...emp, children: [] });
      });

      // Second pass: build tree
      emps.forEach((emp) => {
        const node = employeeMap.get(emp.id)!;
        if (emp.manager_id && employeeMap.has(emp.manager_id)) {
          const manager = employeeMap.get(emp.manager_id)!;
          if (!manager.children) manager.children = [];
          manager.children.push(node);
        } else {
          roots.push(node);
        }
      });

      return roots;
    };

    // Build department hierarchy tree
    const buildDepartmentTree = (depts: DepartmentNode[]): DepartmentNode[] => {
      const deptMap = new Map<string, DepartmentNode>();
      const roots: DepartmentNode[] = [];

      // First pass: create all nodes
      depts.forEach((dept) => {
        const deptEmployees = employeesByDept.get(dept.id) || [];
        const head = dept.head_id ? deptEmployees.find((e) => e.id === dept.head_id) : null;
        deptMap.set(dept.id, {
          ...dept,
          head: head || null,
          employees: buildEmployeeTree(deptEmployees),
          children: [],
        });
      });

      // Second pass: build tree
      depts.forEach((dept) => {
        const node = deptMap.get(dept.id)!;
        if (dept.parent_id && deptMap.has(dept.parent_id)) {
          const parent = deptMap.get(dept.parent_id)!;
          if (!parent.children) parent.children = [];
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      });

      return roots;
    };

    // Build department structure with hierarchy
    const deptStructure: (DepartmentNode | { type: 'no-dept'; employees: EmployeeNode[] })[] = [];
    const departmentTree = buildDepartmentTree(filteredDepartments);
    
    // Add root departments to structure
    departmentTree.forEach((rootDept) => {
      deptStructure.push(rootDept);
    });

    // Add employees without department
    if (employeesWithoutDept.length > 0) {
      deptStructure.push({
        type: 'no-dept',
        employees: buildEmployeeTree(employeesWithoutDept),
      });
    }

    return deptStructure;
  }, [departments, employees, selectedDepartment, searchQuery]);

  // Build complete hierarchy tree (all employees regardless of department)
  // Only includes employees from the current company and ensures managers are also from the same company
  const completeHierarchy = useMemo(() => {
    const employeeMap = new Map<string, EmployeeNode>();
    const roots: EmployeeNode[] = [];

    // Create all nodes - employees are already filtered by company_id in the query
    employees.forEach((emp) => {
      employeeMap.set(emp.id, { ...emp, children: [] });
    });

    // Build tree - only link if manager exists in the same company
    employees.forEach((emp) => {
      const node = employeeMap.get(emp.id)!;
      if (emp.manager_id && employeeMap.has(emp.manager_id)) {
        // Manager exists in the same company (since employees are already filtered by company_id)
        const manager = employeeMap.get(emp.manager_id)!;
        if (!manager.children) manager.children = [];
        manager.children.push(node);
      } else {
        // No manager or manager not in same company - this is a root node
        roots.push(node);
      }
    });

    return roots;
  }, [employees]);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode === 'hierarchy') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && viewMode === 'hierarchy') {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Export functions
  const handleExport = () => {
    const data = {
      departments: departments.map(d => ({
        name: d.name,
        description: d.description,
        head: d.head_id ? employees.find(e => e.id === d.head_id)?.first_name + ' ' + employees.find(e => e.id === d.head_id)?.last_name : null,
        employeeCount: employees.filter(e => e.department === d.name).length
      })),
      employees: employees.map(e => ({
        name: `${e.first_name} ${e.last_name}`,
        position: e.position,
        department: e.department,
        email: e.email,
        manager: e.manager_id ? employees.find(m => m.id === e.manager_id)?.first_name + ' ' + employees.find(m => m.id === e.manager_id)?.last_name : null
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organizasyon-semasi-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Toggle node expansion for tree view
  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Sort employees for table view
  const sortedEmployees = useMemo(() => {
    const sorted = [...employees];
    sorted.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'name':
          compareValue = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
          break;
        case 'position':
          compareValue = (a.position || '').localeCompare(b.position || '');
          break;
        case 'department':
          compareValue = (a.department || '').localeCompare(b.department || '');
          break;
        case 'email':
          compareValue = (a.email || '').localeCompare(b.email || '');
          break;
        case 'status':
          compareValue = (a.status || '').localeCompare(b.status || '');
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    return sorted;
  }, [employees, sortField, sortOrder]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Get direct reports count
  const getDirectReports = (employeeId: string) => {
    return employees.filter(emp => emp.manager_id === employeeId).length;
  };

  // Get manager name
  const getManagerName = (managerId: string | null | undefined) => {
    if (!managerId) return '-';
    const manager = employees.find(emp => emp.id === managerId);
    return manager ? `${manager.first_name} ${manager.last_name}` : '-';
  };

  // Render table view
  const renderTableView = () => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 hover:bg-transparent"
                  onClick={() => handleSort('name')}
                >
                  <span>Çalışan</span>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 hover:bg-transparent"
                  onClick={() => handleSort('position')}
                >
                  <span>Pozisyon</span>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 hover:bg-transparent"
                  onClick={() => handleSort('department')}
                >
                  <span>Departman</span>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Yönetici</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 hover:bg-transparent"
                  onClick={() => handleSort('email')}
                >
                  <span>E-posta</span>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 hover:bg-transparent"
                  onClick={() => handleSort('status')}
                >
                  <span>Durum</span>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-center">Doğrudan Raporlar</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEmployees.length > 0 ? (
              sortedEmployees.map((emp) => {
                const isHead = departments.some(d => d.head_id === emp.id);
                const directReports = getDirectReports(emp.id);

                return (
                  <TableRow
                    key={emp.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isHead && "bg-amber-50/50 hover:bg-amber-50/70"
                    )}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={emp.avatar_url || undefined} alt={`${emp.first_name} ${emp.last_name}`} />
                          <AvatarFallback className={cn(
                            "font-semibold",
                            isHead ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
                          )}>
                            {emp.first_name[0]}{emp.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {emp.first_name} {emp.last_name}
                            </span>
                            {isHead && (
                              <Crown className="h-4 w-4 text-amber-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{emp.position || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{emp.department || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getManagerName(emp.manager_id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[200px]">{emp.email || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={emp.status === 'aktif' ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs",
                          emp.status === 'aktif' && "bg-green-100 text-green-800 border-green-200"
                        )}
                      >
                        {emp.status || 'Belirsiz'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {directReports > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {directReports}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/employees/${emp.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Görüntüle
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Çalışan bulunamadı</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Render employee node for list/grid views
  const renderEmployeeCard = (node: EmployeeNode, isHead: boolean = false) => {
    const directReports = getDirectReports(node.id);

    return (
      <div
        key={node.id}
        className={cn(
          "group p-3 rounded-lg border-2 bg-card hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden relative",
          isHead ? "bg-gradient-to-br from-amber-50 to-white border-amber-300 hover:border-amber-400" : "hover:border-primary/40"
        )}
        onClick={() => navigate(`/employees/${node.id}`)}
      >
        {isHead && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-bl-full opacity-30" />
        )}

        <div className="relative flex flex-col items-center text-center gap-2">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm group-hover:shadow-md transition-shadow">
              <AvatarImage src={node.avatar_url || undefined} alt={`${node.first_name} ${node.last_name}`} />
              <AvatarFallback className={cn(
                "text-sm font-bold",
                isHead ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
              )}>
                {node.first_name[0]}{node.last_name[0]}
              </AvatarFallback>
            </Avatar>
            {isHead && (
              <div className="absolute -top-0.5 -right-0.5 bg-amber-500 rounded-full p-0.5 shadow-sm">
                <Crown className="h-2.5 w-2.5 text-white" />
              </div>
            )}
            {node.status === 'aktif' && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>

          <div className="w-full">
            <h4 className="font-semibold text-sm leading-tight mb-1">
              {node.first_name} {node.last_name}
            </h4>

            {isHead && (
              <Badge variant="outline" className="mb-1.5 text-[10px] py-0 bg-amber-100 text-amber-700 border-amber-300">
                <Crown className="h-2.5 w-2.5 mr-0.5" />
                Şef
              </Badge>
            )}

            <div className="space-y-1 text-xs mt-2">
              {node.position && (
                <div className="flex items-center justify-center gap-1 bg-gray-50 rounded py-1 px-1.5 text-[10px]">
                  <Briefcase className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="font-medium truncate">{node.position}</span>
                </div>
              )}
              {node.department && (
                <div className="flex items-center justify-center gap-1 bg-blue-50 rounded py-1 px-1.5 text-[10px]">
                  <Building2 className="h-3 w-3 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-blue-700 truncate">{node.department}</span>
                </div>
              )}
            </div>

            {directReports > 0 && (
              <div className="mt-2 pt-2 border-t">
                <Badge variant="outline" className="text-[10px] py-0 bg-gradient-to-r from-blue-50 to-purple-50">
                  <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                  {directReports}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render employee node for tree view
  const renderEmployeeNode = (node: EmployeeNode, level: number = 0, isHead: boolean = false): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const indent = level * 20;
    const isExpanded = expandedNodes.has(node.id);
    const directReports = getDirectReports(node.id);

    return (
      <div key={node.id} className="relative">
        <div className="flex items-start gap-1.5" style={{ marginLeft: `${indent}px` }}>
          {/* Expand/Collapse button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 mt-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpansion(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}

          <div
            className={cn(
              "flex-1 flex items-start gap-1.5 p-1.5 rounded-lg border bg-card hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer",
              isHead && "bg-gradient-to-r from-amber-50 to-white border-amber-300 hover:border-amber-400",
              !hasChildren && "ml-8"
            )}
            onClick={() => navigate(`/employees/${node.id}`)}
          >
            <div className="flex-shrink-0">
              <Avatar className="h-7 w-7 border border-background">
                <AvatarImage src={node.avatar_url || undefined} alt={`${node.first_name} ${node.last_name}`} />
                <AvatarFallback className={cn(
                  "font-semibold text-[10px]",
                  isHead ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
                )}>
                  {node.first_name[0]}{node.last_name[0]}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                <span className="font-semibold text-[11px]">
                  {node.first_name} {node.last_name}
                </span>
                {isHead && (
                  <Badge variant="outline" className="text-[9px] py-0 px-1 bg-amber-100 text-amber-700 border-amber-300">
                    <Crown className="h-2 w-2 mr-0.5" />
                    Şef
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground flex-wrap">
                {node.position && (
                  <div className="flex items-center gap-0.5">
                    <Briefcase className="h-2 w-2" />
                    <span>{node.position}</span>
                  </div>
                )}
                {node.department && (
                  <div className="flex items-center gap-0.5">
                    <Building2 className="h-2 w-2" />
                    <span>{node.department}</span>
                  </div>
                )}
              </div>
            </div>

            {directReports > 0 && (
              <div className="flex-shrink-0">
                <Badge variant="secondary" className="text-[9px] py-0 px-1">
                  <Users className="h-2 w-2 mr-0.5" />
                  {directReports}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Render children - only if expanded */}
        {hasChildren && isExpanded && (
          <div className="mt-1.5 space-y-1.5">
            {node.children!.map((child) => renderEmployeeNode(child, level + 1, false))}
          </div>
        )}
      </div>
    );
  };

  // Department color system - generates consistent colors for departments
  const getDepartmentColor = (departmentName?: string) => {
    const departmentColors = [
      { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', gradient: 'from-blue-50 to-blue-100' },
      { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700', gradient: 'from-pink-50 to-pink-100' },
      { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', gradient: 'from-amber-50 to-amber-100' },
      { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', gradient: 'from-green-50 to-green-100' },
      { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', gradient: 'from-purple-50 to-purple-100' },
      { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', gradient: 'from-indigo-50 to-indigo-100' },
      { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700', gradient: 'from-teal-50 to-teal-100' },
      { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', gradient: 'from-orange-50 to-orange-100' },
      { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', gradient: 'from-cyan-50 to-cyan-100' },
      { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', gradient: 'from-rose-50 to-rose-100' },
    ];

    if (!departmentName) {
      return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', gradient: 'from-gray-50 to-gray-100' };
    }

    // Simple hash function for consistent color assignment
    let hash = 0;
    for (let i = 0; i < departmentName.length; i++) {
      hash = departmentName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % departmentColors.length;
    return departmentColors[index];
  };

  // Render hierarchy tree view (SVG-based)
  const renderHierarchyTree = () => {
    const nodeWidth = 160;
    const nodeHeight = 80;
    const horizontalSpacing = 30;
    const verticalSpacing = 100;

    // Build level map: collect all nodes at each hierarchy level
    const buildLevelMap = (nodes: EmployeeNode[], level: number = 0, levelMap: Map<number, EmployeeNode[]> = new Map()): Map<number, EmployeeNode[]> => {
      nodes.forEach(node => {
        if (!levelMap.has(level)) {
          levelMap.set(level, []);
        }
        levelMap.get(level)!.push(node);
        
        if (node.children && node.children.length > 0) {
          buildLevelMap(node.children, level + 1, levelMap);
        }
      });
      return levelMap;
    };

    // Calculate positions with proper centering for each level
    const calculatePositions = (): Array<{node: EmployeeNode, x: number, y: number, level: number}> => {
      const positions: Array<{node: EmployeeNode, x: number, y: number, level: number}> = [];
      const levelMap = buildLevelMap(completeHierarchy);
      
      if (levelMap.size === 0) return positions;
      
      const maxLevel = Math.max(...Array.from(levelMap.keys()));
      const maxNodesInLevel = Math.max(...Array.from(levelMap.values()).map(nodes => nodes.length));
      
      // Calculate canvas dimensions
      const canvasPadding = 50;
      const maxLevelWidth = maxNodesInLevel * nodeWidth + (maxNodesInLevel - 1) * horizontalSpacing;
      const canvasWidth = maxLevelWidth + canvasPadding * 2;
      const centerX = canvasWidth / 2;
      
      const startY = 40;

      // Position each level, centering all nodes horizontally
      levelMap.forEach((nodes, level) => {
        const totalWidth = nodes.length * nodeWidth + (nodes.length - 1) * horizontalSpacing;
        const levelStartX = centerX - totalWidth / 2;

        nodes.forEach((node, index) => {
          const x = levelStartX + index * (nodeWidth + horizontalSpacing);
          const y = startY + level * verticalSpacing;
          positions.push({ node, x, y, level });
        });
      });

      return positions;
    };

    const positions = calculatePositions();
    if (positions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[700px] border border-gray-300 bg-white">
          <Users className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-2">Organizasyon şeması için veri bulunamadı</p>
          <p className="text-sm text-gray-500">Çalışanlar eklendiğinde şema burada görünecektir</p>
        </div>
      );
    }
    
    const maxLevel = Math.max(...positions.map(p => p.level));
    const maxNodesInLevel = Math.max(...Array.from(new Set(positions.map(p => p.level))).map(level => 
      positions.filter(p => p.level === level).length
    ));
    
    const canvasPadding = 50;
    const maxLevelWidth = maxNodesInLevel * nodeWidth + (maxNodesInLevel - 1) * horizontalSpacing;
    const svgWidth = maxLevelWidth + canvasPadding * 2;
    const svgHeight = (maxLevel + 1) * verticalSpacing + nodeHeight + canvasPadding;

    return (
      <div
        ref={containerRef}
        className="relative w-full h-[700px] overflow-auto border border-gray-300 bg-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: svgWidth,
            height: svgHeight,
            position: 'relative',
          }}
        >
        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgHeight}
          className="absolute top-0 left-0"
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="2.5"
              orient="auto"
            >
              <polygon points="0 0, 8 2.5, 0 5" fill="#64748b" />
            </marker>

            {/* Gradient for department heads */}
            <linearGradient id="gradient-head" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#fef3c7', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
            </linearGradient>

            {/* Gradient for normal employees */}
            <linearGradient id="gradient-normal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#f8fafc', stopOpacity: 1 }} />
            </linearGradient>

            {/* Drop shadow filter */}
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08"/>
            </filter>
          </defs>

          {/* Draw connections - simple straight lines from parent to child */}
          {positions.map(({ node, x, y }) => {
            if (node.manager_id) {
              const managerPos = positions.find(p => p.node.id === node.manager_id);
              if (managerPos) {
                const fromX = managerPos.x + nodeWidth / 2;
                const fromY = managerPos.y + nodeHeight;
                const toX = x + nodeWidth / 2;
                const toY = y;
                const midY = (fromY + toY) / 2;

                return (
                  <g key={`connection-${node.id}`}>
                    {/* Vertical line from manager down */}
                    <line
                      x1={fromX}
                      y1={fromY}
                      x2={fromX}
                      y2={midY}
                      stroke="#000000"
                      strokeWidth="1.5"
                    />
                    {/* Horizontal line */}
                    <line
                      x1={fromX}
                      y1={midY}
                      x2={toX}
                      y2={midY}
                      stroke="#000000"
                      strokeWidth="1.5"
                    />
                    {/* Vertical line to child */}
                    <line
                      x1={toX}
                      y1={midY}
                      x2={toX}
                      y2={toY}
                      stroke="#000000"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              }
            }
            return null;
          })}

          {/* Draw nodes */}
          {positions.map(({ node, x, y }) => {
            const isHead = departments.some(d => d.head_id === node.id);
            const deptColor = getDepartmentColor(node.department);

            return (
              <g key={node.id}>
                <foreignObject x={x} y={y} width={nodeWidth} height={nodeHeight}>
                  <div
                    className={cn(
                      "h-full flex flex-col items-center justify-center text-center bg-white rounded-lg shadow-sm border-2 cursor-pointer group",
                      "transition-all duration-300 ease-in-out",
                      "hover:shadow-lg hover:scale-105 hover:-translate-y-1 hover:border-primary",
                      deptColor.border
                    )}
                    onClick={() => navigate(`/employees/${node.id}`)}
                  >
                    {/* Avatar - Top */}
                    <div className="mt-2">
                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20 transition-all duration-300">
                        <AvatarImage src={node.avatar_url || undefined} alt={`${node.first_name} ${node.last_name}`} />
                        <AvatarFallback className={cn(
                          "text-xs font-semibold transition-colors",
                          `${deptColor.bg} ${deptColor.text}`
                        )}>
                          {node.first_name[0]}{node.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Name - Bold */}
                    <div className="mt-2 px-2">
                      <div className="font-bold text-xs text-gray-900 leading-tight group-hover:text-primary transition-colors">
                        {node.first_name} {node.last_name}
                      </div>
                    </div>

                    {/* Position - Italic */}
                    {node.position && (
                      <div className="mt-0.5 px-2 mb-2">
                        <div className="text-[10px] italic text-gray-600 leading-tight truncate max-w-full">
                          {node.position}
                        </div>
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
        </div>
      </div>
    );
  };

  const renderDepartment = (dept: DepartmentNode | { type: 'no-dept'; employees: EmployeeNode[] }, level: number = 0) => {
    if ('type' in dept && dept.type === 'no-dept') {
      const isExpanded = expandedNodes.has('no-dept');

      return (
        <div key="no-dept" className="space-y-1.5">
          <div
            className="flex items-center gap-1.5 p-1.5 bg-gradient-to-r from-gray-50 to-white rounded-lg border cursor-pointer hover:shadow-sm transition-all"
            onClick={() => toggleNodeExpansion('no-dept')}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold">Departman Tanımsız</h3>
            <Badge variant="secondary" className="text-[9px] py-0 px-1">
              {dept.employees.length}
            </Badge>
          </div>
          {isExpanded && (
            <div className="space-y-1 pl-2 ml-5 border-l-2 border-gray-200">
              {dept.employees.map((emp) => renderEmployeeNode(emp, 0, false))}
            </div>
          )}
        </div>
      );
    }

    const department = dept as DepartmentNode;
    const hasHead = department.head !== null;
    const otherEmployees = department.employees.filter(
      (emp) => !hasHead || emp.id !== department.head!.id
    );
    const hasParent = department.parent_id !== null;
    const indent = level * 14;
    const isExpanded = expandedNodes.has(department.id);
    const hasChildren = department.children && department.children.length > 0;

    return (
      <div key={department.id} className="space-y-1.5" style={{ marginLeft: `${indent}px` }}>
        <div
          className={cn(
            "flex items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200",
            hasParent
              ? "bg-gradient-to-r from-blue-50 to-white border-blue-200 hover:border-blue-300"
              : "bg-gradient-to-r from-primary/5 to-white border-primary/30 hover:border-primary/50"
          )}
          onClick={() => toggleNodeExpansion(department.id)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          <Building2 className={cn(
            "h-3.5 w-3.5",
            hasParent ? "text-blue-600" : "text-primary"
          )} />
          <div className="flex-1 flex items-center gap-1.5 flex-wrap">
            <h3 className={cn(
              "font-semibold",
              hasParent ? "text-[11px]" : "text-xs"
            )}>
              {department.name}
            </h3>
            {hasParent && (
              <Badge variant="outline" className="text-[9px] py-0 px-1 bg-blue-50 text-blue-700 border-blue-200">
                Alt
              </Badge>
            )}
            {department.description && (
              <span className="text-[9px] text-muted-foreground truncate max-w-[200px]">- {department.description}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-[9px] py-0 px-1">
              <Users className="h-2 w-2 mr-0.5" />
              {department.employees.length}
            </Badge>
            {hasChildren && (
              <Badge variant="outline" className="text-[9px] py-0 px-1">
                <Building2 className="h-2 w-2 mr-0.5" />
                {department.children.length}
              </Badge>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-1 pl-2 ml-5 border-l-2 border-primary/20">
            {/* Department Head */}
            {hasHead && department.head && (
              <div className="mb-1.5">
                {renderEmployeeNode(department.head, 0, true)}
              </div>
            )}

            {/* Other Employees */}
            {otherEmployees.map((emp) => renderEmployeeNode(emp, hasHead ? 1 : 0, false))}

            {/* Child Departments */}
            {hasChildren && (
              <div className="mt-1.5 space-y-1.5">
                {department.children!.map((childDept) => renderDepartment(childDept, level + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organizasyon Şeması</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orgStructure.length === 0 && completeHierarchy.length === 0 && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organizasyon Şeması</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Organizasyon şeması için veri bulunamadı</p>
            <p className="text-sm mt-2">
              Departmanlar ve çalışanlar tanımlandığında şema burada görünecektir
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Organizasyon Şeması</CardTitle>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="hierarchy" title="Hiyerarşik Görünüm">
                  <Network className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="tree" title="Ağaç Görünümü">
                  <List className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="table" title="Tablo Görünümü">
                  <TableIcon className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list" title="Liste Görünümü">
                  <List className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="grid" title="Kart Görünümü">
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Zoom Controls (only for hierarchy view) */}
            {viewMode === 'hierarchy' && (
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs px-2 min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 2}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetZoom}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Export/Print */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                title="Dışa Aktar"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                title="Yazdır"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {viewMode === 'hierarchy' && (
          <div className="space-y-4">
            {renderHierarchyTree()}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                💡 Görünümü kaydırmak için sürükleyin, yakınlaştırmak için zoom kontrollerini kullanın
              </p>
            </div>
          </div>
        )}

        {viewMode === 'tree' && (
          <div className="space-y-6">
            {orgStructure.length > 0 ? (
              <>
                <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p>💡 İpucu: Departmanları ve çalışanları genişletmek/daraltmak için tıklayın</p>
                </div>
                {orgStructure.map((dept) => renderDepartment(dept, 0))}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Filtre kriterlerine uygun veri bulunamadı</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'table' && renderTableView()}

        {viewMode === 'list' && (
          <div className="space-y-4">
            {completeHierarchy.length > 0 ? (
              completeHierarchy.map((root) => (
                <div key={root.id} className="space-y-2">
                  {renderEmployeeCard(root)}
                  {root.children && root.children.map(child => (
                    <div key={child.id} className="ml-8">
                      {renderEmployeeCard(child)}
                      {child.children && child.children.map(grandchild => (
                        <div key={grandchild.id} className="ml-8">
                          {renderEmployeeCard(grandchild)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Çalışan bulunamadı</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
            {employees.length > 0 ? (
              employees.map((emp) => {
                const isHead = departments.some(d => d.head_id === emp.id);
                return renderEmployeeCard(emp, isHead);
              })
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Çalışan bulunamadı</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
