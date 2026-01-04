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
import { OrgChartEmployeeCard, getDepartmentColorPalette } from "./OrgChartEmployeeCard";
import { OrgChartMiniMap } from "./OrgChartMiniMap";
import { useOrgChartData, EmployeeNode, DepartmentNode } from "./hooks/useOrgChartData";
import { useOrgChartHierarchy } from "./hooks/useOrgChartHierarchy";
import { useOrgChartControls } from "./hooks/useOrgChartControls";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Data fetching and filtering
  const { departments, employees, allEmployees, isLoading } = useOrgChartData(
    companyId,
    searchQuery,
    selectedStatus,
    selectedPosition
  );

  // Hierarchy building
  const { orgStructure, completeHierarchy } = useOrgChartHierarchy(
    departments,
    employees,
    selectedDepartment,
    searchQuery
  );

  // Controls (zoom, pan, sort)
  const {
    zoom,
    pan,
    setPan,
    isDragging,
    sortField,
    sortOrder,
    expandedNodes,
    collapsedHierarchyNodes,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleSort,
    toggleNodeExpansion,
    toggleHierarchyNode
  } = useOrgChartControls(viewMode);

  // Get visible hierarchy (respects collapsed state)
  const getVisibleHierarchy = useMemo(() => {
    const filterCollapsed = (nodes: EmployeeNode[]): EmployeeNode[] => {
      return nodes.map(node => {
        const isCollapsed = collapsedHierarchyNodes.has(node.id);
        return {
          ...node,
          children: isCollapsed ? [] : filterCollapsed(node.children || [])
        };
      });
    };
    return filterCollapsed(completeHierarchy);
  }, [completeHierarchy, collapsedHierarchyNodes]);

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

  // Render hierarchy tree view (SVG-based) - yFiles style
  const renderHierarchyTree = () => {
    const nodeWidth = 200;
    const nodeHeight = 85;
    const horizontalSpacing = 30; // Yatay boşluk (aynı seviyedeki node'lar arası)
    const verticalSpacing = 120; // Dikey boşluk (seviyeler arası)
    const verticalChildSpacing = 20; // Dikey boşluk (aynı yöneticinin altındaki çalışanlar arası)

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

    // Klasik organizasyon şeması algoritması
    // SEVİYE HESAPLAMA: Otomatik olarak manager zinciri uzunluğuna göre belirlenir
    // - Root node'lar (CEO gibi manager_id=null): level = 0
    // - Root'un direkt raporları (COO, CFO, CTO): level = 1
    // - Onların direkt raporları: level = 2, vs.
    // Her seviye aynı Y pozisyonunda (yatay hizada), X pozisyonu parent'ın ortasında
    const calculatePositions = (): Array<{node: EmployeeNode, x: number, y: number, level: number}> => {
      const positions: Array<{node: EmployeeNode, x: number, y: number, level: number}> = [];
      const nodePositions = new Map<string, {x: number, y: number, level: number}>();

      if (getVisibleHierarchy.length === 0) return positions;

      const startY = 30;

      // Her subtree için genişlik hesapla (bottom-up)
      const calculateSubtreeWidth = (node: EmployeeNode): number => {
        if (!node.children || node.children.length === 0) {
          return nodeWidth;
        }

        // Çocukların toplam genişliğini hesapla
        const totalChildWidth = node.children.reduce((sum, child) => {
          return sum + calculateSubtreeWidth(child);
        }, 0);

        // Çocuklar arası boşluklar
        const spacingWidth = (node.children.length - 1) * horizontalSpacing;

        return Math.max(nodeWidth, totalChildWidth + spacingWidth);
      };

      // Tüm node'ları recursive olarak yerleştir (bottom-up)
      // level parametresi: Bu node'un hiyerarşi seviyesi (0 = root, 1 = root'un çocukları, vs.)
      const positionSubtree = (node: EmployeeNode, level: number, leftX: number): number => {
        // Y pozisyonu: Seviye * (kart yüksekliği + boşluk)
        // Aynı seviyedeki TÜM çalışanlar aynı Y pozisyonunda olacak
        const y = startY + level * (nodeHeight + verticalSpacing);

        if (!node.children || node.children.length === 0) {
          // Yaprak node (alt çalışanı yok)
          nodePositions.set(node.id, { x: leftX, y, level });
          return leftX + nodeWidth;
        }

        // İç node (alt çalışanları var) - önce çocukları yerleştir
        let currentX = leftX;
        const childXPositions: number[] = [];

        node.children.forEach((child) => {
          const childWidth = calculateSubtreeWidth(child);

          // Çocuğu bir sonraki seviyeye yerleştir (level + 1)
          positionSubtree(child, level + 1, currentX);

          const childPos = nodePositions.get(child.id)!;
          childXPositions.push(childPos.x + nodeWidth / 2); // Merkez pozisyonu

          currentX += childWidth + horizontalSpacing;
        });

        // Parent'ı çocukların ortasına yerleştir (yatay merkezleme)
        const firstChildCenter = childXPositions[0];
        const lastChildCenter = childXPositions[childXPositions.length - 1];
        const parentCenterX = (firstChildCenter + lastChildCenter) / 2;
        const parentX = parentCenterX - nodeWidth / 2;

        nodePositions.set(node.id, { x: parentX, y, level });

        // Toplam genişliği döndür
        return currentX - horizontalSpacing;
      };

      // Root node'ları yerleştir (genellikle sadece CEO, ama birden fazla olabilir)
      let totalWidth = 0;
      const rootWidths: number[] = [];

      getVisibleHierarchy.forEach((rootNode) => {
        const width = calculateSubtreeWidth(rootNode);
        rootWidths.push(width);
        totalWidth += width;
      });

      totalWidth += (getVisibleHierarchy.length - 1) * horizontalSpacing * 3;

      // Root'ları level=0 ile yerleştir (en üst seviye)
      let currentX = 0;
      getVisibleHierarchy.forEach((rootNode, index) => {
        const width = rootWidths[index];
        const centerOffset = (width - nodeWidth) / 2;
        positionSubtree(rootNode, 0, currentX + centerOffset); // level = 0 (root seviyesi)
        currentX += width + horizontalSpacing * 3;
      });

      // Convert map to array
      nodePositions.forEach((pos, nodeId) => {
        const node = findNodeInHierarchy(getVisibleHierarchy, nodeId);
        if (node) {
          positions.push({ node, ...pos });
        }
      });

      // Tüm şemayı ortala
      if (positions.length > 0) {
        const minX = Math.min(...positions.map(p => p.x));
        const centerOffset = 100; // Sol taraftan minimum mesafe

        positions.forEach(pos => {
          pos.x = pos.x - minX + centerOffset;
        });
      }

      return positions;
    };

    // Helper function to find node by ID in hierarchy
    const findNodeInHierarchy = (nodes: EmployeeNode[], id: string): EmployeeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNodeInHierarchy(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const positions = calculatePositions();
    if (positions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[700px] border border-border rounded-lg bg-muted/20">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">Organizasyon şeması için veri bulunamadı</p>
          <p className="text-sm text-muted-foreground">Çalışanlar eklendiğinde şema burada görünecektir</p>
        </div>
      );
    }
    
    // Calculate canvas dimensions based on actual positions
    const maxX = Math.max(...positions.map(p => p.x)) + nodeWidth;
    const maxY = Math.max(...positions.map(p => p.y)) + nodeHeight;
    const canvasPadding = 40;
    const svgWidth = Math.max(maxX + canvasPadding, 800);
    const svgHeight = maxY + canvasPadding + 20;

    return (
      <div className="relative">
        {/* Mini Map */}
        <OrgChartMiniMap
          containerRef={containerRef}
          contentWidth={svgWidth}
          contentHeight={svgHeight}
          zoom={zoom}
          pan={pan}
          onNavigate={setPan}
        />
        
        <div
          ref={containerRef}
          className="relative w-full h-[600px] overflow-auto border border-border rounded-lg bg-gradient-to-br from-background via-muted/10 to-background"
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
              {/* Draw orthogonal connections - parent → vertical → horizontal backbone → vertical → children */}
              {positions.map(({ node, x, y, level }) => {
                const children = node.children || [];
                if (children.length === 0) return null;

                const parentCenterX = x + nodeWidth / 2;
                const parentBottomY = y + nodeHeight;

                // Her parent için çocuklarını bul
                const childPositions = children
                  .map(child => positions.find(p => p.node.id === child.id))
                  .filter(Boolean) as Array<{node: EmployeeNode, x: number, y: number, level: number}>;

                if (childPositions.length === 0) return null;

                // Yatay backbone'un Y pozisyonu (parent ile çocuklar arasında)
                const backboneY = parentBottomY + verticalSpacing / 2;

                // İlk ve son çocuğun X pozisyonları
                const firstChildX = childPositions[0].x + nodeWidth / 2;
                const lastChildX = childPositions[childPositions.length - 1].x + nodeWidth / 2;

                return (
                  <g key={`connection-group-${node.id}`}>
                    {/* 1. Parent'tan aşağı inen dikey çizgi */}
                    <line
                      x1={parentCenterX}
                      y1={parentBottomY}
                      x2={parentCenterX}
                      y2={backboneY}
                      stroke="hsl(var(--primary))"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeOpacity="0.7"
                    />

                    {/* Bağlantı noktası - parent'ın altı */}
                    <circle
                      cx={parentCenterX}
                      cy={parentBottomY}
                      r="4"
                      fill="hsl(var(--primary))"
                      stroke="hsl(var(--background))"
                      strokeWidth="2"
                    />

                    {/* 2. Yatay backbone (ana hat) */}
                    <line
                      x1={firstChildX}
                      y1={backboneY}
                      x2={lastChildX}
                      y2={backboneY}
                      stroke="hsl(var(--primary))"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeOpacity="0.7"
                    />

                    {/* Bağlantı noktası - backbone'un ortası */}
                    <circle
                      cx={parentCenterX}
                      cy={backboneY}
                      r="3.5"
                      fill="hsl(var(--primary))"
                      stroke="hsl(var(--background))"
                      strokeWidth="1.5"
                    />

                    {/* 3. Her child'a dikey bağlantılar */}
                    {childPositions.map((childPos) => {
                      const childCenterX = childPos.x + nodeWidth / 2;
                      const childTopY = childPos.y;

                      return (
                        <g key={`child-connection-${childPos.node.id}`}>
                          {/* Backbone'dan child'a dikey çizgi */}
                          <line
                            x1={childCenterX}
                            y1={backboneY}
                            x2={childCenterX}
                            y2={childTopY}
                            stroke="hsl(var(--primary))"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeOpacity="0.7"
                          />

                          {/* Bağlantı noktası - backbone üzerinde */}
                          <circle
                            cx={childCenterX}
                            cy={backboneY}
                            r="3"
                            fill="hsl(var(--primary))"
                            stroke="hsl(var(--background))"
                            strokeWidth="1.5"
                          />

                          {/* Bağlantı noktası - child'ın üstü */}
                          <circle
                            cx={childCenterX}
                            cy={childTopY}
                            r="3"
                            fill="hsl(var(--primary))"
                            stroke="hsl(var(--background))"
                            strokeWidth="1.5"
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>

            {/* Draw yFiles-style employee cards */}
            {positions.map(({ node, x, y }) => {
              const deptColor = getDepartmentColorPalette(node.department);
              const directReports = getDirectReports(node.id);
              // Check original hierarchy for actual children (not filtered)
              const hasActualChildren = directReports > 0;
              const isCollapsed = collapsedHierarchyNodes.has(node.id);

              return (
                <div
                  key={node.id}
                  className="absolute"
                  style={{ left: x, top: y }}
                >
                  <OrgChartEmployeeCard
                    id={node.id}
                    firstName={node.first_name}
                    lastName={node.last_name}
                    position={node.position}
                    department={node.department}
                    email={node.email}
                    avatarUrl={node.avatar_url}
                    status={node.status}
                    directReports={directReports}
                    hasChildren={hasActualChildren}
                    isExpanded={!isCollapsed}
                    departmentColor={deptColor}
                    onClick={() => navigate(`/employees/${node.id}`)}
                    onToggleExpand={() => toggleHierarchyNode(node.id)}
                  />
                </div>
              );
            })}
          </div>
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
