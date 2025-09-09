
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PerformanceRecord } from "./types";

interface PerformanceHistoryTableProps {
  data: PerformanceRecord[];
}

export const PerformanceHistoryTable = ({ data }: PerformanceHistoryTableProps) => {
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dönem</TableHead>
            <TableHead>Değerlendiren</TableHead>
            <TableHead>Teknik</TableHead>
            <TableHead>İletişim</TableHead>
            <TableHead>Takım</TableHead>
            <TableHead>Liderlik</TableHead>
            <TableHead>Genel</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.review_period}</TableCell>
              <TableCell>{record.reviewer_name}</TableCell>
              <TableCell>{record.technical_score}</TableCell>
              <TableCell>{record.communication_score}</TableCell>
              <TableCell>{record.teamwork_score}</TableCell>
              <TableCell>{record.leadership_score}</TableCell>
              <TableCell>{record.overall_score.toFixed(1)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
