import React, { useState } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { WorkOrder, WorkOrderStatus } from "@/types/production";
import WorkOrdersTableHeader from "./table/WorkOrdersTableHeader";
import { WorkOrdersTableRow } from "./table/WorkOrdersTableRow";
import WorkOrdersTableEmpty from "./table/WorkOrdersTableEmpty";
import WorkOrdersTableSkeleton from "./table/WorkOrdersTableSkeleton";
import type { WorkOrderSortField, WorkOrderSortDirection } from "./table/WorkOrdersTableHeader";

interface WorkOrdersTableProps {
  workOrders: WorkOrder[];
  isLoading: boolean;
  onSelectWorkOrder: (workOrder: WorkOrder) => void;
  onEditWorkOrder?: (workOrder: WorkOrder) => void;
  onDeleteWorkOrder?: (workOrderId: string) => void;
  onStatusChange?: (workOrderId: string, status: WorkOrderStatus) => void;
  searchQuery?: string;
  statusFilter?: string;
}

const WorkOrdersTable = ({
  workOrders,
  isLoading,
  onSelectWorkOrder,
  onEditWorkOrder,
  onDeleteWorkOrder,
  onStatusChange,
  searchQuery,
  statusFilter
}: WorkOrdersTableProps) => {
  const [sortField, setSortField] = useState<WorkOrderSortField>("order_number");
  const [sortDirection, setSortDirection] = useState<WorkOrderSortDirection>("desc");

  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesSearch = !searchQuery || 
      wo.order_number.toString().includes(searchQuery) ||
      wo.title.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || !statusFilter || wo.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSort = (field: WorkOrderSortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedWorkOrders = [...filteredWorkOrders].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "order_number":
        aValue = a.order_number;
        bValue = b.order_number;
        break;
      case "title":
        aValue = a.title?.toLowerCase() || "";
        bValue = b.title?.toLowerCase() || "";
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority] || 0;
        bValue = priorityOrder[b.priority] || 0;
        break;
      case "planned_start_date":
        aValue = a.planned_start_date ? new Date(a.planned_start_date).getTime() : 0;
        bValue = b.planned_start_date ? new Date(b.planned_start_date).getTime() : 0;
        break;
      case "quantity":
        aValue = a.quantity || 0;
        bValue = b.quantity || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  if (isLoading) {
    return <WorkOrdersTableSkeleton />;
  }

  return (
    <Table>
      <WorkOrdersTableHeader
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
      <TableBody>
        {sortedWorkOrders.length === 0 ? (
          <WorkOrdersTableEmpty />
        ) : (
          sortedWorkOrders.map((workOrder, index) => (
            <WorkOrdersTableRow
              key={workOrder.id}
              workOrder={workOrder}
              index={index}
              onSelect={onSelectWorkOrder}
              onEdit={onEditWorkOrder}
              onDelete={onDeleteWorkOrder}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default WorkOrdersTable;
