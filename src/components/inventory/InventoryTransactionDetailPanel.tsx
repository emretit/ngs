import InventoryTransactionDetails from "./detail/InventoryTransactionDetails";
import type { InventoryTransaction } from "@/types/inventory";

interface InventoryTransactionDetailPanelProps {
  transaction: InventoryTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const InventoryTransactionDetailPanel = ({ transaction, isOpen, onClose }: InventoryTransactionDetailPanelProps) => {
  return (
    <InventoryTransactionDetails transaction={transaction} isOpen={isOpen} onClose={onClose} />
  );
};

export default InventoryTransactionDetailPanel;

