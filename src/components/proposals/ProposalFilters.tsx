
import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusStyles } from "./constants";
import { Plus } from "lucide-react";

interface ProposalFiltersProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (status: string) => void;
  onDateRangeChange?: (range: any) => void;
  selectedStatus: string;
}

export const ProposalFilters = ({
  onSearchChange,
  onStatusChange,
  onDateRangeChange,
  selectedStatus,
}: ProposalFiltersProps) => {
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearchChange(e.target.value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 items-end">
      <div>
        <Label htmlFor="search">Teklif Ara</Label>
        <Input
          id="search"
          placeholder="Teklif ara..."
          value={searchValue}
          onChange={handleSearchChange}
        />
      </div>

      <div>
        <Label htmlFor="status">Durum</Label>
        <Select
          value={selectedStatus}
          onValueChange={(value) => onStatusChange(value)}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Tüm durumlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm durumlar</SelectItem>
            <SelectItem value="discovery_scheduled">🔎 Discovery</SelectItem>
            <SelectItem value="meeting_completed">👥 Meeting Completed</SelectItem>
            <SelectItem value="sent">📤 Sent</SelectItem>
            <SelectItem value="negotiation">🔄 Negotiation</SelectItem>
            <SelectItem value="approved">✅ Approved</SelectItem>
            <SelectItem value="rejected">❌ Rejected</SelectItem>
            <SelectItem value="converted_to_order">📦 Ordered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-3 lg:col-span-2 flex justify-end">
        <Button asChild>
          <Link to="/proposals/new" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add New Proposal
          </Link>
        </Button>
      </div>
    </div>
  );
};
