import { useState, memo, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Tag, MoreHorizontal, Search, Filter, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useCashflowCategories, CreateCategoryData } from "@/hooks/useCashflowCategories";
import { useCashflowSubcategories } from "@/hooks/useCashflowSubcategories";
import { useToast } from "@/components/ui/use-toast";

interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
  isSubcategory: boolean;
  parentCategoryId?: string;
}

interface CategoryItemProps {
  category: any;
  onEdit: (category: any) => void;
  onDelete: (category: any) => void;
  subcategories: any[];
  loading?: boolean;
  createSubcategory: (categoryId: string, name: string) => Promise<any>;
  updateSubcategory: (id: string, name: string) => Promise<any>;
  deleteSubcategory: (id: string) => Promise<void>;
  refetchSubcategories: () => Promise<void>;
}

const CategoryItem = memo(({ category, onEdit, onDelete, subcategories, loading: subcategoriesLoading, createSubcategory, updateSubcategory, deleteSubcategory, refetchSubcategories }: CategoryItemProps) => {
  const [isAddSubcategoryOpen, setIsAddSubcategoryOpen] = useState(false);
  const [isEditSubcategoryOpen, setIsEditSubcategoryOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [isDeleteSubcategoryOpen, setIsDeleteSubcategoryOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<any>(null);
  const [isDeletingSubcategory, setIsDeletingSubcategory] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Bu kategoriye ait alt kategorileri filtrele
  const categorySubcategories = useMemo(() => 
    subcategories.filter(sub => sub.category_id === category.id),
    [subcategories, category.id]
  );

  const {
    register: registerSubcategory,
    handleSubmit: handleSubmitSubcategory,
    reset: resetSubcategory,
    setValue: setValueSubcategory,
    formState: { errors: subcategoryErrors, isSubmitting: isSubmittingSubcategory }
  } = useForm<{ name: string }>({
    defaultValues: { name: '' }
  });

  const onSubmitCreateSubcategory = async (data: { name: string }) => {
    try {
      await createSubcategory(category.id, data.name);
      await refetchSubcategories();
      setIsAddSubcategoryOpen(false);
      resetSubcategory({ name: '' });
    } catch (error) {
      console.error('Failed to create subcategory:', error);
    }
  };

  const onSubmitEditSubcategory = async (data: { name: string }) => {
    if (!editingSubcategory) return;

    try {
      await updateSubcategory(editingSubcategory.id, data.name);
      await refetchSubcategories();
      setIsEditSubcategoryOpen(false);
      setEditingSubcategory(null);
      resetSubcategory({ name: '' });
    } catch (error) {
      console.error('Failed to update subcategory:', error);
    }
  };

  const handleEditSubcategory = (subcategory: any) => {
    setEditingSubcategory(subcategory);
    setValueSubcategory('name', subcategory.name);
    setIsEditSubcategoryOpen(true);
  };

  const handleDeleteSubcategoryClick = (subcategory: any) => {
    setSubcategoryToDelete(subcategory);
    setIsDeleteSubcategoryOpen(true);
  };

  const handleDeleteSubcategoryConfirm = async () => {
    if (!subcategoryToDelete) return;

    setIsDeletingSubcategory(true);
    try {
      await deleteSubcategory(subcategoryToDelete.id);
      await refetchSubcategories();
    } catch (error) {
      console.error('Failed to delete subcategory:', error);
    } finally {
      setIsDeletingSubcategory(false);
      setIsDeleteSubcategoryOpen(false);
      setSubcategoryToDelete(null);
    }
  };

  const isIncome = category.type === 'income';
  const colorScheme = isIncome
    ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' }
    : { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' };

  return (
    <div className="bg-white rounded-lg hover:shadow-sm transition-all duration-200">
      {/* Ana Kategori Kartı */}
      <div className="p-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-2 h-2 ${colorScheme.dot} rounded-full flex-shrink-0`}></div>
            <div className="flex-1 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={categorySubcategories.length > 0 ? () => setIsExpanded(!isExpanded) : undefined}
                disabled={categorySubcategories.length === 0}
                className={`w-full justify-between p-2 h-8 text-xs font-medium transition-all duration-200 text-gray-900 hover:text-gray-900 ${
                  isIncome
                    ? 'hover:bg-emerald-50 border-0 hover:shadow-sm'
                    : 'hover:bg-rose-50 border-0 hover:shadow-sm'
                } ${isExpanded ? 'shadow-sm' : ''} ${categorySubcategories.length === 0 ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="truncate font-semibold">{category.name}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    categorySubcategories.length > 0 
                      ? `${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} font-semibold`
                      : `${isIncome ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-500'}`
                      }`}>
                        {categorySubcategories.length}
                      </span>
                  {categorySubcategories.length > 0 && (
                    isExpanded ? (
                        <ChevronDown className="h-3 w-3 flex-shrink-0 transition-transform" />
                      ) : (
                        <ChevronRight className="h-3 w-3 flex-shrink-0 transition-transform" />
                    )
                  )}
                </div>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Alt Kategori Ekle */}
            <Dialog open={isAddSubcategoryOpen} onOpenChange={setIsAddSubcategoryOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-gray-100"
                  title="Alt kategori ekle"
                >
                  <Plus className="h-3 w-3 text-gray-500" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Alt Kategori Ekle</DialogTitle>
                  <p className="text-sm text-gray-600">"{category.name}" kategorisine alt kategori ekleyin</p>
                </DialogHeader>
                <form onSubmit={handleSubmitSubcategory(onSubmitCreateSubcategory)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subcategory-name" className="text-sm font-medium">Alt Kategori Adı</Label>
                    <Input
                      id="subcategory-name"
                      placeholder={isIncome ? "Örn: Satış Geliri" : "Örn: Ofis Malzemeleri"}
                      {...registerSubcategory('name', { required: 'Alt kategori adı gereklidir' })}
                      className="h-10"
                    />
                    {subcategoryErrors.name && (
                      <p className="text-sm text-red-600">{subcategoryErrors.name.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddSubcategoryOpen(false)}
                      className="px-4"
                    >
                      İptal
                    </Button>
                    <Button type="submit" disabled={isSubmittingSubcategory} className="px-4">
                      {isSubmittingSubcategory ? 'Ekleniyor...' : 'Alt Kategori Ekle'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Kategori İşlemleri */}
            {category.company_id && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(category)}
                  className="h-5 w-5 p-0 hover:bg-gray-100"
                  title="Düzenle"
                >
                  <Edit className="h-3 w-3 text-gray-500" />
                </Button>
                {!category.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(category)}
                    className="h-5 w-5 p-0 hover:bg-red-100"
                    title="Sil"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Alt Kategoriler - Şık Dropdown Panel */}
        {categorySubcategories.length > 0 && isExpanded && (
          <div className="mt-2 pt-2 border-t border-gray-100/80">
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-[10px] font-normal text-gray-400 uppercase tracking-wide">Alt Kategoriler</h4>
                <span className="text-[10px] text-gray-400">{categorySubcategories.length} adet</span>
              </div>
              {categorySubcategories.map((subcategory, index) => (
                <div
                  key={subcategory.id}
                  className={`group flex items-center justify-between py-1 px-2 rounded-md text-sm hover:bg-gradient-to-r transition-all duration-200 border border-transparent hover:border-gray-200/60 min-h-[32px] ${
                    isIncome
                      ? 'bg-emerald-50/50 hover:from-emerald-50 hover:to-emerald-100/50'
                      : 'bg-rose-50/50 hover:from-rose-50 hover:to-rose-100/50'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isIncome ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}></div>
                    <span className="text-gray-900 truncate font-medium leading-none">{subcategory.name}</span>
                  </div>
                  {/* Sabit alt kategorilerde düzenleme ve silme butonları gösterilmez, ama aynı genişliği ve yüksekliği korumak için boş div */}
                  <div className="flex gap-1 flex-shrink-0 w-[52px] min-w-[52px] h-6 items-center justify-end">
                    {!subcategory.is_default && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSubcategory(subcategory)}
                          className="h-6 w-6 p-0 hover:bg-white/80 hover:shadow-sm transition-all"
                          title="Düzenle"
                        >
                          <Edit className="h-3 w-3 text-gray-500 hover:text-gray-700" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubcategoryClick(subcategory)}
                          className="h-6 w-6 p-0 hover:bg-red-50 hover:shadow-sm transition-all"
                          title="Sil"
                        >
                          <Trash2 className="h-3 w-3 text-red-400 hover:text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alt Kategori Düzenleme Dialog */}
      <Dialog open={isEditSubcategoryOpen} onOpenChange={setIsEditSubcategoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Alt Kategori Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitSubcategory(onSubmitEditSubcategory)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-subcategory-name" className="text-sm font-medium">Alt Kategori Adı</Label>
              <Input
                id="edit-subcategory-name"
                placeholder={isIncome ? "Örn: Satış Geliri" : "Örn: Ofis Malzemeleri"}
                {...registerSubcategory('name', { required: 'Alt kategori adı gereklidir' })}
                className="h-10"
              />
              {subcategoryErrors.name && (
                <p className="text-sm text-red-600">{subcategoryErrors.name.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditSubcategoryOpen(false);
                  setEditingSubcategory(null);
                }}
                className="px-4"
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmittingSubcategory} className="px-4">
                {isSubmittingSubcategory ? 'Güncelleniyor...' : 'Alt Kategori Güncelle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alt Kategori Silme Onay Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteSubcategoryOpen}
        onOpenChange={setIsDeleteSubcategoryOpen}
        title="Alt Kategoriyi Sil"
        description={`"${subcategoryToDelete?.name || 'Bu alt kategori'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteSubcategoryConfirm}
        onCancel={() => {
          setIsDeleteSubcategoryOpen(false);
          setSubcategoryToDelete(null);
        }}
        isLoading={isDeletingSubcategory}
      />
    </div>
  );
});

CategoryItem.displayName = 'CategoryItem';

interface CategoryManagementProps {
  searchQuery?: string;
  selectedType?: 'all' | 'income' | 'expense';
  selectedStatus?: string;
  externalOpenCreateDialog?: boolean;
  onExternalDialogOpened?: () => void;
}

const CategoryManagement = memo(({ searchQuery = "", selectedType: propSelectedType = 'all', selectedStatus, externalOpenCreateDialog, onExternalDialogOpened }: CategoryManagementProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // External dialog açma kontrolü
  useEffect(() => {
    if (externalOpenCreateDialog) {
      setIsCreateOpen(true);
      onExternalDialogOpened?.();
    }
  }, [externalOpenCreateDialog, onExternalDialogOpened]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchTerm = searchQuery;
  const selectedType = propSelectedType;

  const { categories, loading, createCategory, updateCategory, deleteCategory, getCategoriesByType, refetch } = useCashflowCategories();
  // Tüm alt kategorileri tek seferde yükle (categoryId olmadan)
  const { subcategories: allSubcategories, loading: subcategoriesLoading, createSubcategory, updateSubcategory, deleteSubcategory, refetch: refetchSubcategories } = useCashflowSubcategories();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormData>({
    defaultValues: {
      type: 'expense',
      isSubcategory: false,
      parentCategoryId: undefined
    }
  });

  const watchedType = watch('type');
  const watchedIsSubcategory = watch('isSubcategory');

  const onSubmitCreate = useCallback(async (data: CategoryFormData) => {
    try {
      if (data.isSubcategory && data.parentCategoryId) {
        await createSubcategory(data.parentCategoryId, data.name);
        await refetchSubcategories();
        await refetch();
      } else {
        await createCategory({ name: data.name, type: data.type });
        await refetch();
      }
      setIsCreateOpen(false);
      reset({ type: 'expense', name: '', isSubcategory: false, parentCategoryId: undefined });
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  }, [createSubcategory, createCategory, refetch, refetchSubcategories, reset]);

  const onSubmitEdit = useCallback(async (data: CategoryFormData) => {
    if (!editingCategory) return;

    try {
      await updateCategory(editingCategory.id, { name: data.name, type: data.type });
      setIsEditOpen(false);
      setEditingCategory(null);
      reset({ type: 'expense', name: '', isSubcategory: false, parentCategoryId: undefined });
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  }, [editingCategory, updateCategory, reset]);

  const handleEdit = useCallback((category: any) => {
    setEditingCategory(category);
    setValue('name', category.name);
    setValue('type', category.type);
    setIsEditOpen(true);
  }, [setValue]);

  const handleDeleteClick = useCallback((category: any) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await deleteCategory(categoryToDelete.id);
    } catch (error: any) {
      // Hata mesajı zaten useCashflowCategories hook'unda toast olarak gösteriliyor
      // Burada sadece console'a yazıyoruz
      console.error('Failed to delete category:', error);
      
      // Eğer hata mesajı varsa ve toast gösterilmemişse burada göster
      if (error?.message) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: error.message,
          duration: 2000,
        });
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  }, [categoryToDelete, deleteCategory, toast]);

  // Memoized category calculations
  const expenseCategories = useMemo(() => getCategoriesByType('expense'), [categories, getCategoriesByType]);
  const incomeCategories = useMemo(() => getCategoriesByType('income'), [categories, getCategoriesByType]);

  // Kategorileri sırala: Önce varsayılanlar (alfabetik), sonra kullanıcı ekledikleri (alfabetik)
  const sortCategories = useCallback((categories: any[]) => {
    const defaultCats = categories.filter(cat => cat.is_default === true).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    const userCats = categories.filter(cat => !cat.is_default || cat.is_default === false).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    return [...defaultCats, ...userCats];
  }, []);

  const sortedIncomeCategories = useMemo(() => sortCategories(incomeCategories), [incomeCategories, sortCategories]);
  const sortedExpenseCategories = useMemo(() => sortCategories(expenseCategories), [expenseCategories, sortCategories]);

  // Memoized filtered categories
  const filteredCategories = useMemo(() => {
    let filtered = categories;

    if (selectedType !== 'all') {
      filtered = getCategoriesByType(selectedType);
    }

    if (searchTerm) {
      filtered = filtered.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [categories, selectedType, searchTerm, getCategoriesByType]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Gelir Kategorileri Kartı */}
      <div className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-green-200">
          <div className="p-5">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Gelirler</h2>
                  <p className="text-xs text-gray-500">Gelir türleri ve kategorileri</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1 h-7"
                  onClick={() => {
                    setValue('type', 'income');
                    setIsCreateOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Yeni
                </Button>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-sm font-bold text-emerald-700">
                {sortedIncomeCategories.filter(cat => searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true).length}
              </div>
              <div className="text-xs text-emerald-600">Toplam</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
              <div className="text-sm font-bold text-green-700">
                {sortedIncomeCategories.filter(cat => cat.company_id).length}
              </div>
              <div className="text-xs text-green-600">Aktif</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm font-bold text-blue-700">
                0
              </div>
              <div className="text-xs text-blue-600">Alt Kategori</div>
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-1">
            {sortedIncomeCategories.filter(cat => searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true).length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-medium text-gray-700 mb-1">Henüz gelir kategorisi yok</p>
                <p className="text-xs text-gray-500 mb-2">İlk gelir kategorinizi ekleyin</p>
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1"
                  onClick={() => {
                    setValue('type', 'income');
                    setIsCreateOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Ekle
                </Button>
              </div>
            ) : (
              sortedIncomeCategories
                .filter(cat => searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true)
                .map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    subcategories={allSubcategories}
                    loading={subcategoriesLoading}
                    createSubcategory={createSubcategory}
                    updateSubcategory={updateSubcategory}
                    deleteSubcategory={deleteSubcategory}
                    refetchSubcategories={refetchSubcategories}
                  />
                ))
            )}
            </div>
          </div>
        </div>

        {/* Masraf Kategorileri Kartı */}
        <div className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-rose-200">
          <div className="p-5">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                  <TrendingDown className="h-4 w-4" />
                </div>
        <div>
                  <h2 className="text-sm font-bold text-gray-900">Giderler</h2>
                  <p className="text-xs text-gray-500">Gider türleri ve kategorileri</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-xs px-2 py-1 h-7"
                  onClick={() => {
                    setValue('type', 'expense');
                    setIsCreateOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Yeni
                </Button>
                <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></div>
              </div>
            </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-rose-50 rounded-lg border border-rose-100">
              <div className="text-sm font-bold text-rose-700">
                {sortedExpenseCategories.filter(cat => searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true).length}
              </div>
              <div className="text-xs text-rose-600">Toplam</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded-lg border border-red-100">
              <div className="text-sm font-bold text-red-700">
                {sortedExpenseCategories.filter(cat => cat.company_id).length}
              </div>
              <div className="text-xs text-red-600">Aktif</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-sm font-bold text-purple-700">
                0
              </div>
              <div className="text-xs text-purple-600">Alt Kategori</div>
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-1">
            {sortedExpenseCategories.filter(cat => searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true).length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <TrendingDown className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-medium text-gray-700 mb-1">Henüz gider kategorisi yok</p>
                <p className="text-xs text-gray-500 mb-2">İlk gider kategorinizi ekleyin</p>
                <Button 
                  size="sm" 
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-2 py-1"
                  onClick={() => {
                    setValue('type', 'expense');
                    setIsCreateOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Ekle
                </Button>
              </div>
            ) : (
              sortedExpenseCategories
                .filter(cat => searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true)
                .map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    subcategories={allSubcategories}
                    loading={subcategoriesLoading}
                    createSubcategory={createSubcategory}
                    updateSubcategory={updateSubcategory}
                    deleteSubcategory={deleteSubcategory}
                    refetchSubcategories={refetchSubcategories}
                  />
                ))
            )}
            </div>
          </div>
        </div>

      {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Yeni Kategori Oluştur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Kategori Adı</Label>
                <Input
                  id="name"
                  placeholder="Örn: Satış Geliri"
                  {...register('name', { required: 'Kategori adı gereklidir' })}
                  className="h-11"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Kategori Türü</Label>
                <select
                  value={watchedType}
                  onChange={(e) => setValue('type', e.target.value as 'income' | 'expense')}
                  disabled={watchedIsSubcategory}
                  className="w-full h-11 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="expense">🔴 Gider</option>
                  <option value="income">🟢 Gelir</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isSubcategory"
                  {...register('isSubcategory')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="isSubcategory" className="text-sm font-medium cursor-pointer">
                  Bu bir alt kategori
                </Label>
              </div>

              {watchedIsSubcategory && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ana Kategori</Label>
                  <select
                    {...register('parentCategoryId', { required: watchedIsSubcategory ? 'Ana kategori seçimi zorunludur' : false })}
                    className="w-full h-11 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Ana kategori seçiniz</option>
                    {getCategoriesByType(watchedType).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.parentCategoryId && (
                    <p className="text-sm text-red-600">{errors.parentCategoryId.message}</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-6"
                >
                  İptal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="px-6">
                  {isSubmitting
                    ? (watchedIsSubcategory ? 'Alt Kategori Ekleniyor...' : 'Kategori Oluşturuluyor...')
                    : (watchedIsSubcategory ? 'Alt Kategori Ekle' : 'Kategori Oluştur')
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Kategori Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">Kategori Adı</Label>
              <Input
                id="edit-name"
                placeholder="Örn: Satış Geliri"
                {...register('name', { required: 'Kategori adı gereklidir' })}
                className="h-11"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Kategori Türü</Label>
              <select
                value={watchedType}
                onChange={(e) => setValue('type', e.target.value as 'income' | 'expense')}
                className="w-full h-11 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="expense">🔴 Masraf</option>
                <option value="income">🟢 Gelir</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingCategory(null);
                }}
                className="px-6"
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="px-6">
                {isSubmitting ? 'Güncelleniyor...' : 'Kategori Güncelle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Kategoriyi Sil"
        description={`"${categoryToDelete?.name || 'Bu kategori'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setCategoryToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </>
  );
});

CategoryManagement.displayName = 'CategoryManagement';

export default CategoryManagement;