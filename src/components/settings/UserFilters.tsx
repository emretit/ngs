
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserFiltersProps = {
  filter: string;
  setFilter: (value: string) => void;
  roleFilter: string | undefined;
  setRoleFilter: (value: string | undefined) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (value: 'asc' | 'desc') => void;
};

export const UserFilters = ({
  filter,
  setFilter,
  roleFilter,
  setRoleFilter,
  sortOrder,
  setSortOrder,
}: UserFiltersProps) => {
  return (
    <div className="flex gap-4 mt-4">
      <Input
        placeholder="Kullanıcı ara..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-xs"
      />
      <Select
        value={roleFilter}
        onValueChange={setRoleFilter}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Rol seç" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Roller</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="sales">Satış</SelectItem>
          <SelectItem value="manager">Yönetici</SelectItem>
          <SelectItem value="viewer">Görüntüleyici</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={sortOrder}
        onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sıralama" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">En Eski</SelectItem>
          <SelectItem value="desc">En Yeni</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
