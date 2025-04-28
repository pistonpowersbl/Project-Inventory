import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Create the context
const InventoryContext = createContext();

// Provider component
export function InventoryProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/items");
      setItems(response.data);
    } catch (error) {
      toast.error("❌ Failed to fetch items.");
    } finally {
      setLoading(false);
    }
  };

  const handleItemAdded = (newItem) => {
    setItems((prevItems) => [...prevItems, newItem]);
  };

  const handleDeleteItem = async (deletedId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/items/${deletedId}`);
      if (response.status === 200) {
        setItems((prevItems) => prevItems.filter((item) => item.id !== deletedId));
        toast.success("🗑️ Item deleted successfully!");
      } else {
        toast.error("❌ Failed to delete item.");
      }
    } catch (error) {
      toast.error("❌ Failed to delete item.");
    }
  };

  const handleUpdateItem = async (updatedItem) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/items/${updatedItem.id}`,
        updatedItem
      );
      if (response.status === 200) {
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === updatedItem.id ? updatedItem : item
          )
        );
        toast.success("✅ Item updated!");
      } else {
        toast.error("❌ Failed to update item.");
      }
    } catch (error) {
      toast.error("❌ Failed to update item.");
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        loading,
        fetchItems,
        handleItemAdded,
        handleDeleteItem,
        handleUpdateItem,
        setItems,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

// Custom hook for easy usage
export function useInventory() {
  return useContext(InventoryContext);
}