import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Tag, MoreHorizontal, Search, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { useCashflowCategories, CreateCategoryData } from "@/hooks/useCashflowCategories";
import { useCashflowSubcategories } from "@/hooks/useCashflowSubcategories";

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
}

const CategoryItem = ({ category, onEdit, onDelete }: CategoryItemProps) => {
  const [isAddSubcategoryOpen, setIsAddSubcategoryOpen] = useState(false);
  const [isEditSubcategoryOpen, setIsEditSubcategoryOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [isDeleteSubcategoryOpen, setIsDeleteSubcategoryOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<any>(null);
  const [isDeletingSubcategory, setIsDeletingSubcategory] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { subcategories, loading: subcategoriesLoading, createSubcategory, updateSubcategory, deleteSubcategory } = useCashflowSubcategories(category.id);

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
      <div className="p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-2 h-2 ${colorScheme.dot} rounded-full flex-shrink-0`}></div>
            <div className="flex-1 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={subcategories.length > 0 ? () => setIsExpanded(!isExpanded) : undefined}
                disabled={subcategories.length === 0}
                className={`w-full justify-between p-2 h-8 text-xs font-medium transition-all duration-200 text-gray-900 hover:text-gray-900 ${
                  isIncome
                    ? 'hover:bg-emerald-50 border-0 hover:shadow-sm'
                    : 'border-dashed hover:bg-rose-50 border-rose-200 hover:border-rose-300 hover:shadow-sm disabled:bg-rose-25 disabled:border-rose-100'
                } ${isExpanded ? 'shadow-sm' : ''} ${subcategories.length === 0 ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="truncate font-semibold">{category.name}</span>
                <div className="flex items-center gap-1">
                  {subcategories.length > 0 ? (
                    <>
                      <span className={`text-xs px-1 py-0.5 rounded-full text-gray-700 ${
                        isIncome ? 'bg-emerald-100' : 'bg-rose-100'
                      }`}>
                        {subcategories.length}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 flex-shrink-0 transition-transform" />
                      ) : (
                        <ChevronRight className="h-3 w-3 flex-shrink-0 transition-transform" />
                      )}
                    </>
                  ) : (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full text-gray-600 ${
                      isIncome ? 'bg-emerald-50' : 'bg-rose-50'
                    }`}>
                      {isIncome ? 'Gelir' : 'Gider'}
                    </span>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(category)}
                  className="h-5 w-5 p-0 hover:bg-red-100"
                  title="Sil"
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Alt Kategoriler - Şık Dropdown Panel */}
        {subcategories.length > 0 && isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100/80">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Alt Kategoriler</h4>
                <span className="text-xs text-gray-400">{subcategories.length} adet</span>
              </div>
              {subcategories.map((subcategory, index) => (
                <div
                  key={subcategory.id}
                  className={`group flex items-center justify-between py-2 px-3 rounded-md text-sm hover:bg-gradient-to-r transition-all duration-200 border border-transparent hover:border-gray-200/60 ${
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
                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
};

const CategoryManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

  const { categories, loading, createCategory, updateCategory, deleteCategory, getCategoriesByType } = useCashflowCategories();
  const { createSubcategory } = useCashflowSubcategories();

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

  const onSubmitCreate = async (data: CategoryFormData) => {
    try {
      if (data.isSubcategory && data.parentCategoryId) {
        await createSubcategory(data.parentCategoryId, data.name);
      } else {
        await createCategory({ name: data.name, type: data.type });
      }
      setIsCreateOpen(false);
      reset({ type: 'expense', name: '', isSubcategory: false, parentCategoryId: undefined });
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const onSubmitEdit = async (data: CategoryFormData) => {
    if (!editingCategory) return;

    try {
      await updateCategory(editingCategory.id, { name: data.name, type: data.type });
      setIsEditOpen(false);
      setEditingCategory(null);
      reset({ type: 'expense', name: '', isSubcategory: false, parentCategoryId: undefined });
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setValue('name', category.name);
    setValue('type', category.type);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (category: any) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await deleteCategory(categoryToDelete.id);
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const expenseCategories = getCategoriesByType('expense');
  const incomeCategories = getCategoriesByType('income');

  // Filtreleme
  const filteredCategories = () => {
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
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kategori Yönetimi</h2>
          <p className="text-gray-600">Gelir ve gider kategorilerinizi organize edin</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Kategori
            </Button>
          </DialogTrigger>
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
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700 mb-1">Gelir Kategorileri</p>
              <p className="text-3xl font-bold text-emerald-800">{incomeCategories.length}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-6 border border-rose-200/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-700 mb-1">Gider Kategorileri</p>
              <p className="text-3xl font-bold text-rose-800">{expenseCategories.length}</p>
            </div>
            <div className="p-3 bg-rose-100 rounded-xl">
              <TrendingDown className="h-6 w-6 text-rose-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Toplam Kategori</p>
              <p className="text-3xl font-bold text-blue-800">{categories.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Tag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Kategori ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as 'all' | 'income' | 'expense')}
            className="h-11 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="income">Gelir Kategorileri</option>
            <option value="expense">Gider Kategorileri</option>
          </select>
        </div>
      </div>

      {/* Kategoriler - İki Sütunlu Yapı */}
      {selectedType === 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gelir Kategorileri - Sol Sütun */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Gelir Kategorileri</h3>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                {incomeCategories.filter(cat => searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true).length} kategori
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {incomeCategories
                .filter(cat => searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true)
                .map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              {incomeCategories.filter(cat => searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-emerald-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Gelir kategorisi bulunamadı</p>
                  <p className="text-sm text-gray-400 mt-1">Yeni gelir kategorisi oluşturun</p>
                </div>
              )}
            </div>
          </div>

          {/* Gider Kategorileri - Sağ Sütun */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Gider Kategorileri</h3>
              <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                {expenseCategories.filter(cat => searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true).length} kategori
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {expenseCategories
                .filter(cat => searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true)
                .map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              {expenseCategories.filter(cat => searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingDown className="h-8 w-8 text-rose-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Gider kategorisi bulunamadı</p>
                  <p className="text-sm text-gray-400 mt-1">Yeni gider kategorisi oluşturun</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Filtrelenmiş Görünüm
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCategories().length > 0 ? (
            filteredCategories().map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Kategori bulunamadı</p>
              <p className="text-sm text-gray-400 mt-1">Arama terimlerinizi değiştirin veya yeni kategori oluşturun</p>
            </div>
          )}
        </div>
      )}

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
                <option value="expense">🔴 Gider</option>
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
    </div>
  );
};

export default CategoryManagement;