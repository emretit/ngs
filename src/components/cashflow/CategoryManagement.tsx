import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useCashflowCategories, CreateCategoryData } from "@/hooks/useCashflowCategories";

interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
}

const CategoryManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const { categories, loading, createCategory, updateCategory, deleteCategory, getCategoriesByType } = useCashflowCategories();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormData>({
    defaultValues: {
      type: 'expense'
    }
  });

  const watchedType = watch('type');

  const onSubmitCreate = async (data: CategoryFormData) => {
    try {
      await createCategory(data);
      setIsCreateOpen(false);
      reset({ type: 'expense', name: '' });
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const onSubmitEdit = async (data: CategoryFormData) => {
    if (!editingCategory) return;
    
    try {
      await updateCategory(editingCategory.id, data);
      setIsEditOpen(false);
      setEditingCategory(null);
      reset({ type: 'expense', name: '' });
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

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`"${name}" kategorisini silmek istediğinizden emin misiniz?`)) {
      await deleteCategory(id);
    }
  };

  const expenseCategories = getCategoriesByType('expense');
  const incomeCategories = getCategoriesByType('income');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Kategori Yönetimi</h2>
          <p className="text-gray-600 text-sm">Gelir ve gider kategorilerinizi yönetin</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Kategori Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kategori Oluştur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Kategori Adı</Label>
                <Input
                  id="name"
                  placeholder="Kategori adı girin"
                  {...register('name', { required: 'Kategori adı gereklidir' })}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div className="space-y-3">
                <Label>Kategori Türü</Label>
                <RadioGroup
                  value={watchedType}
                  onValueChange={(value: 'income' | 'expense') => setValue('type', value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="create-income" />
                    <Label htmlFor="create-income" className="text-green-600 font-medium">Gelir</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="create-expense" />
                    <Label htmlFor="create-expense" className="text-red-600 font-medium">Gider</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateOpen(false)}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Oluşturuluyor...' : 'Kategori Oluştur'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gelir Kategorileri</p>
                <p className="text-2xl font-bold text-green-600">{incomeCategories.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gider Kategorileri</p>
                <p className="text-2xl font-bold text-red-600">{expenseCategories.length}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Gelir Kategorileri</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Gelir
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {category.user_id && ( // Only show edit/delete for user-created categories
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(category.id, category.name)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {incomeCategories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                      Hiçbir gelir kategorisi bulunamadı
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Gider Kategorileri</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        Gider
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {category.user_id && ( // Only show edit/delete for user-created categories
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(category.id, category.name)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {expenseCategories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                      Hiçbir gider kategorisi bulunamadı
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategori Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Kategori Adı</Label>
              <Input
                id="edit-name"
                placeholder="Kategori adı girin"
                {...register('name', { required: 'Kategori adı gereklidir' })}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-3">
              <Label>Kategori Türü</Label>
              <RadioGroup
                value={watchedType}
                onValueChange={(value: 'income' | 'expense') => setValue('type', value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="edit-income" />
                  <Label htmlFor="edit-income" className="text-green-600 font-medium">Gelir</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="edit-expense" />
                  <Label htmlFor="edit-expense" className="text-red-600 font-medium">Gider</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingCategory(null);
                }}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Güncelleniyor...' : 'Kategori Güncelle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManagement;