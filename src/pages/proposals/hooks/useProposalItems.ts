import { useCallback } from "react";
import { ProposalItem } from "@/types/proposal";

interface LineItem extends ProposalItem {
  row_number: number;
}

export const useProposalItems = (
  items: LineItem[],
  setItems: React.Dispatch<React.SetStateAction<LineItem[]>>,
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
  currency: string
) => {
  const handleItemChange = useCallback((index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setItems(updatedItems);
    setHasChanges(true);
  }, [items, setItems, setHasChanges]);

  const addItem = useCallback(() => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      row_number: items.length + 1,
      name: "",
      description: "",
      quantity: 1,
      unit: "adet",
      unit_price: 0,
      total_price: 0,
      currency: currency
    };
    setItems([...items, newItem]);
    setHasChanges(true);
  }, [items, setItems, setHasChanges, currency]);

  const removeItem = useCallback((index: number) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      // Renumber items
      const renumberedItems = updatedItems.map((item, i) => ({
        ...item,
        row_number: i + 1
      }));
      setItems(renumberedItems);
      setHasChanges(true);
    }
  }, [items, setItems, setHasChanges]);

  // Move item up
  const moveItemUp = useCallback((index: number) => {
    setItems(prevItems => {
      if (index > 0) {
        const updatedItems = [...prevItems];
        const [movedItem] = updatedItems.splice(index, 1);
        updatedItems.splice(index - 1, 0, movedItem);
        
        // Renumber items
        return updatedItems.map((item, i) => ({
          ...item,
          row_number: i + 1
        }));
      }
      return prevItems;
    });
    setHasChanges(true);
  }, [setItems, setHasChanges]);

  // Move item down
  const moveItemDown = useCallback((index: number) => {
    setItems(prevItems => {
      if (index < prevItems.length - 1) {
        const updatedItems = [...prevItems];
        const [movedItem] = updatedItems.splice(index, 1);
        updatedItems.splice(index + 1, 0, movedItem);
        
        // Renumber items
        return updatedItems.map((item, i) => ({
          ...item,
          row_number: i + 1
        }));
      }
      return prevItems;
    });
    setHasChanges(true);
  }, [setItems, setHasChanges]);

  return {
    handleItemChange,
    addItem,
    removeItem,
    moveItemUp,
    moveItemDown
  };
};

