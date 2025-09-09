
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const RoleManagement = () => {
  const roles = [
    {
      name: 'admin',
      description: 'Tam yönetici erişimi',
      permissions: ['Tüm işlemlere erişim', 'Kullanıcı yönetimi', 'Sistem ayarları']
    },
    {
      name: 'manager',
      description: 'Yönetici erişimi',
      permissions: ['Fırsatları yönetme', 'Raporlara erişim', 'Takım yönetimi']
    },
    {
      name: 'employee',
      description: 'Çalışan erişimi',
      permissions: ['Müşteri yönetimi', 'Fırsatları görüntüleme', 'Temel işlemler']
    }
  ];

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Rol & İzin Yönetimi</h2>
          <Button>Yeni Rol Ekle</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rol</TableHead>
            <TableHead>Açıklama</TableHead>
            <TableHead>İzinler</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.name}>
              <TableCell className="font-medium capitalize">{role.name}</TableCell>
              <TableCell>{role.description}</TableCell>
              <TableCell>
                <ul className="list-disc list-inside">
                  {role.permissions.map((permission, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      {permission}
                    </li>
                  ))}
                </ul>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  Düzenle
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
