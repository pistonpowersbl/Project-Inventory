import React, { useState } from "react";
import axios from "axios";
import "./Modal.css";

const EditItemModal = ({ item, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({ ...item });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:5000/api/items/${item.id}`,
        formData
      );
      alert("✅ Item updated!");
      onUpdate(response.data);
      onClose();
    } catch (err) {
      console.error("❌ Error updating item:", err);
      alert("❌ Failed to update item.");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Edit Item</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <input name="code" placeholder="HSN Code" value={formData.code} onChange={handleChange} required />
          <input name="name" placeholder="Item Name" value={formData.name} onChange={handleChange} required />
          <input name="category" placeholder="Category" value={formData.category} onChange={handleChange} required />
          <input name="sub_category" placeholder="Subcategory" value={formData.sub_category} onChange={handleChange} required />
          <input name="quantity" placeholder="Quantity" type="number" value={formData.quantity} onChange={handleChange} required />
          <input name="purchase_price" placeholder="Purchase Price" type="number" value={formData.purchase_price} onChange={handleChange} required />
          <input name="selling_price" placeholder="Selling Price" type="number" value={formData.selling_price} onChange={handleChange} required />
          <input name="gst_rate" placeholder="GST Rate" type="number" value={formData.gst_rate} onChange={handleChange} required />

          <div className="modal-buttons">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;
