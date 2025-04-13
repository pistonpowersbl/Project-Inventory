import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // ✅ Added
import "./App.css";
import AddItemModal from "./AddItemModal";
import ItemList from "./ItemList";
import EditItemModal from "./EditItemModal";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SalesAndBilling from "./pages/SalesAndBilling/SalesAndBilling"; // ✅ New route import
import SalesEntry from "./pages/SalesAndBilling/SalesEntry"; // ✅ Added

function InventoryManagementPage() {
  const [items, setItems] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/items");
      const itemsWithHSN = response.data.map(item => ({
        ...item,
        hsn_code: item.code
      }));
      setItems(itemsWithHSN);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("❌ Failed to fetch items.");
    }
  };

  const handleItemAdded = (newItem) => {
    setItems((prevItems) => [...prevItems, newItem]);
    setShowAddModal(false);
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
      console.error("Delete Error:", error);
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
        setShowEditModal(false);
        setSelectedItem(null);
      } else {
        console.error("Unexpected status:", response.status);
        toast.error("❌ Failed to update item.");
      }
    } catch (error) {
      console.error("Update Error:", error.response || error.message || error);
      toast.error("❌ Failed to update item.");
    }
  };

  return (
    <div className="App">
      <h1>🛒 Shop Inventory Management</h1>

      <button onClick={() => setShowAddModal(true)} style={{ marginBottom: "10px" }}>
        ➕ Add Item
      </button>

      <ItemList
  items={items}
  onDelete={handleDeleteItem}
  onUpdate={handleUpdateItem}
  onEdit={(item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  }}
/>


      {showEditModal && selectedItem && (
        <EditItemModal
          item={selectedItem}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          onUpdate={handleUpdateItem}
        />
      )}

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onItemAdded={handleItemAdded}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InventoryManagementPage />} />
        <Route path="/sales-billing" element={<SalesAndBilling />} /> {/* ✅ New page */}
        <Route path="/sales-billing/sales-entry" element={<SalesEntry />} /> {/* ✅ New subpage route */}
      </Routes>
    </Router>
  );
}

export default App;
