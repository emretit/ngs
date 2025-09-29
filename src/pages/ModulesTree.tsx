import React, { useState, useCallback, useEffect } from 'react';
import { ReactFlowProvider, useReactFlow, Node } from 'reactflow';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import DefaultLayout from '@/components/layouts/DefaultLayout';
import { ModuleFlow } from '@/components/modules/ModuleFlow';
import { RightDrawer } from '@/components/modules/RightDrawer';
import { ShortcutsModal } from '@/components/modules/ShortcutsModal';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { 
  Search, 
  Filter, 
  RotateCcw, 
  Download, 
  HelpCircle,
  Layers,
  X,
  AlertCircle,
  Package
} from 'lucide-react';

import { useModuleData, ModuleFilters } from '@/lib/useModuleData';
import { useDebounce } from '@/hooks/useDebounce';
import { exportToPng } from '@/utils/exportPng';

interface ModulesTreeProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

// Main component wrapper for ReactFlow
const ModulesTreeContent: React.FC<ModulesTreeProps> = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const reactFlowInstance = useReactFlow();
  
  const {
    modules,
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
    refetch
  } = useModuleData();

  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

  // Sync debounced search with global state
  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setSearchTerm]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Help modal
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // Search focus
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Modül"]') as HTMLInputElement;
        searchInput?.focus();
        return;
      }

      // Fit view
      if (event.key === 'f' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        reactFlowInstance.fitView({ padding: 0.1, duration: 800 });
        return;
      }

      // Reset zoom
      if (event.key === '0' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
        return;
      }

      // Zoom in/out
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        const currentZoom = reactFlowInstance.getZoom();
        reactFlowInstance.setViewport({ 
          ...reactFlowInstance.getViewport(), 
          zoom: Math.min(currentZoom * 1.2, 2) 
        });
        return;
      }

      if (event.key === '-') {
        event.preventDefault();
        const currentZoom = reactFlowInstance.getZoom();
        reactFlowInstance.setViewport({ 
          ...reactFlowInstance.getViewport(), 
          zoom: Math.max(currentZoom * 0.8, 0.2) 
        });
        return;
      }

      // Close modals with Escape
      if (event.key === 'Escape') {
        setShortcutsOpen(false);
        setDrawerOpen(false);
        setSelectedModule(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reactFlowInstance]);

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedModule(node.data);
    setDrawerOpen(true);
  }, []);

  const handleExportPng = useCallback(async () => {
    try {
      toast.promise(
        exportToPng(reactFlowInstance, 'pafta-module-tree'),
        {
          loading: 'PNG dışa aktarılıyor...',
          success: 'Başarıyla dışa aktarıldı!',
          error: 'Dışa aktarımda hata oluştu'
        }
      );
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [reactFlowInstance]);

  const handleResetView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.1, duration: 800 });
    localStorage.removeItem('module-tree-viewport');
  }, [reactFlowInstance]);

  const handleClearFilters = useCallback(() => {
    setLocalSearchTerm('');
    setFilters({ kind: [], is_active: null, tags: [] });
    setMaxDepth(3);
  }, [setFilters, setMaxDepth]);

  const handleFilterChange = useCallback((newFilters: Partial<ModuleFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, [setFilters]);

  const getChildModules = useCallback((moduleId: string) => {
    return modules.filter(m => m.parent === moduleId);
  }, [modules]);

  const hasActiveFilters = searchTerm || filters.kind.length > 0 || filters.is_active !== null || filters.tags.length > 0 || maxDepth < 6;

  if (loading) {
    return (
      <DefaultLayout
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        title="Modül Ağacı"
        subtitle="Pafta.app modülleri yükleniyor..."
      >
        <div className="h-full space-y-4">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-80" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
          {/* Flow skeleton */}
          <div className="flex-1 bg-muted/20 rounded-lg animate-pulse" />
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        title="Modül Ağacı"
        subtitle="Hata oluştu"
      >
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="font-semibold">Modüller yüklenemedi</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={refetch} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Tekrar Dene
            </Button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="Pafta.app Modül Ağacı"
      subtitle="Modüller ve entegrasyonları"
    >
      <div className="h-full flex flex-col gap-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Modül ara... (Ctrl+F)"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Popover */}
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtreler
                  {hasActiveFilters && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                      !
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-4">
                {/* Type filter */}
                <div className="space-y-2">
                  <Label>Modül Türü</Label>
                  <div className="flex gap-2 flex-wrap">
                    {['root', 'group', 'leaf'].map(kind => (
                      <Button
                        key={kind}
                        variant={filters.kind.includes(kind) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const newKinds = filters.kind.includes(kind)
                            ? filters.kind.filter(k => k !== kind)
                            : [...filters.kind, kind];
                          handleFilterChange({ kind: newKinds });
                        }}
                      >
                        {kind === 'root' ? 'Ana Sistem' : kind === 'group' ? 'Grup' : 'Modül'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Active filter */}
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select
                    value={filters.is_active === null ? 'all' : filters.is_active ? 'true' : 'false'}
                    onValueChange={(value) => {
                      const isActive = value === 'all' ? null : value === 'true';
                      handleFilterChange({ is_active: isActive });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="true">Aktif</SelectItem>
                      <SelectItem value="false">Geliştirilecek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags filter */}
                {allTags.length > 0 && (
                  <div className="space-y-2">
                    <Label>Etiketler</Label>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {allTags.map(tag => (
                        <Button
                          key={tag}
                          variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const newTags = filters.tags.includes(tag)
                              ? filters.tags.filter(t => t !== tag)
                              : [...filters.tags, tag];
                            handleFilterChange({ tags: newTags });
                          }}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <Button 
                  variant="outline" 
                  onClick={handleClearFilters}
                  className="w-full"
                  disabled={!hasActiveFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Filtreleri Temizle
                </Button>
              </PopoverContent>
            </Popover>

            {/* Level Control */}
            <div className="flex items-center gap-2 min-w-[140px]">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <Slider
                  value={[maxDepth]}
                  onValueChange={([value]) => setMaxDepth(value)}
                  min={1}
                  max={6}
                  step={1}
                  className="w-full"
                />
              </div>
              <span className="text-sm text-muted-foreground font-mono w-8">
                {maxDepth}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleResetView}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Sıfırla
            </Button>
            
            <Button variant="outline" onClick={handleExportPng}>
              <Download className="h-4 w-4 mr-2" />
              PNG İndir
            </Button>

            <Button variant="outline" size="icon" onClick={() => setShortcutsOpen(true)}>
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Aktif filtreler:</span>
            
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Arama: "{searchTerm}"
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setLocalSearchTerm('')}
                />
              </Badge>
            )}
            
            {filters.kind.map(kind => (
              <Badge key={kind} variant="secondary" className="gap-1">
                {kind === 'root' ? 'Ana Sistem' : kind === 'group' ? 'Grup' : 'Modül'}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange({ 
                    kind: filters.kind.filter(k => k !== kind) 
                  })}
                />
              </Badge>
            ))}
            
            {filters.is_active !== null && (
              <Badge variant="secondary" className="gap-1">
                {filters.is_active ? 'Aktif' : 'Geliştirilecek'}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange({ is_active: null })}
                />
              </Badge>
            )}
            
            {filters.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                #{tag}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange({ 
                    tags: filters.tags.filter(t => t !== tag) 
                  })}
                />
              </Badge>
            ))}
            
            {maxDepth < 6 && (
              <Badge variant="secondary" className="gap-1">
                Seviye ≤ {maxDepth}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setMaxDepth(6)}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Module Flow */}
        <div className="flex-1 relative bg-gradient-to-br from-background via-background to-muted/10 rounded-lg border overflow-hidden" style={{ height: '70vh' }}>
          {nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-semibold">Hiç modül bulunamadı</h3>
                  <p className="text-sm text-muted-foreground">
                    Arama terimlerinizi veya filtrelerinizi değiştirmeyi deneyin
                  </p>
                </div>
                <Button variant="outline" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Filtreleri Temizle
                </Button>
              </div>
            </div>
          ) : (
            <ModuleFlow
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
              className="w-full h-full min-h-[500px]"
            />
          )}
        </div>

        {/* Right Drawer */}
        <RightDrawer
          module={selectedModule}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedModule(null);
          }}
          breadcrumbs={selectedModule ? getBreadcrumbs(selectedModule.id) : []}
          childModules={selectedModule ? getChildModules(selectedModule.id) : []}
        />

        {/* Shortcuts Modal */}
        <ShortcutsModal 
          open={shortcutsOpen} 
          onClose={() => setShortcutsOpen(false)} 
        />
      </div>
    </DefaultLayout>
  );
};

// Main component with ReactFlow provider
const ModulesTree: React.FC<ModulesTreeProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ModulesTreeContent {...props} />
    </ReactFlowProvider>
  );
};

export default ModulesTree;