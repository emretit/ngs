
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Employee } from "../../../types";

interface PersonalInfoFieldsProps {
  formData: Partial<Employee>;
  handleInputChange?: (field: string, value: string) => void;
  isEditing?: boolean;
}

export const PersonalInfoFields = ({
  formData,
  handleInputChange,
  isEditing = false
}: PersonalInfoFieldsProps) => {
  return (
    <>
      <h4 className="text-lg font-medium text-gray-700 mt-8 mb-4">Kişisel Bilgiler</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Doğum Tarihi</Label>
          {isEditing ? (
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth || ''}
              onChange={(e) => handleInputChange?.('date_of_birth', e.target.value)}
            />
          ) : (
            <div className="p-2 bg-gray-50 rounded-md">
              {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString('tr-TR') : '-'}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Cinsiyet</Label>
          {isEditing ? (
            <Select
              value={formData.gender || ''}
              onValueChange={(value) => handleInputChange?.('gender', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cinsiyet seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Erkek</SelectItem>
                <SelectItem value="female">Kadın</SelectItem>
                <SelectItem value="other">Diğer</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="p-2 bg-gray-50 rounded-md">{formData.gender || '-'}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="marital_status">Medeni Durum</Label>
          {isEditing ? (
            <Select
              value={formData.marital_status || ''}
              onValueChange={(value) => handleInputChange?.('marital_status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Medeni durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Bekar</SelectItem>
                <SelectItem value="married">Evli</SelectItem>
                <SelectItem value="divorced">Boşanmış</SelectItem>
                <SelectItem value="widowed">Dul</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="p-2 bg-gray-50 rounded-md">{formData.marital_status || '-'}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="id_ssn">TC Kimlik No / SSN</Label>
          {isEditing ? (
            <Input
              id="id_ssn"
              value={formData.id_ssn || ''}
              onChange={(e) => handleInputChange?.('id_ssn', e.target.value)}
            />
          ) : (
            <div className="p-2 bg-gray-50 rounded-md">{formData.id_ssn || '-'}</div>
          )}
        </div>
      </div>
    </>
  );
};
