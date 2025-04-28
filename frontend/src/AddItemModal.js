import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./Modal.css";

function AddItemModal({ onClose, onItemAdded }) {
  const [formData, setFormData] = useState({
    code: "",
    hsn_code: "", // ✅ Added new field
    company_name: "", // ✅ Changed from 'name'
    category: "",
    sub_category: "",
    quantity: "",
    purchase_price: "",
    selling_price_mrp: "", // ✅ Changed from 'selling_price'
    gst_rate: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/items", formData);
      if (response.status === 200 || response.status === 201) {
        onItemAdded(response.data);
        toast.success("✅ Item added successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error adding item:", error.response?.data || error.message);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("❌ Failed to add item.");
      }
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Add Item</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <input 
            name="code" 
            placeholder="Code" // ✅ Changed from "HSN Code"
            value={formData.code} 
            onChange={handleChange} 
            required 
          />
          <input 
            name="hsn_code" // ✅ Added new field
            placeholder="HSN Code" 
            value={formData.hsn_code} 
            onChange={handleChange} 
          />
          <input 
            name="company_name" // ✅ Changed from 'name'
            placeholder="Company Name" // ✅ Changed from 'Item Name'
            value={formData.company_name} // ✅ Changed from 'name'
            onChange={handleChange} 
            required 
          />
          <input name="category" placeholder="Category" value={formData.category} onChange={handleChange} required />
          <input name="sub_category" placeholder="Subcategory" value={formData.sub_category} onChange={handleChange} required />
          <input name="quantity" placeholder="Quantity" type="number" value={formData.quantity} onChange={handleChange} required />
          <input name="purchase_price" placeholder="Purchase Price" type="number" value={formData.purchase_price} onChange={handleChange} required />
          <input 
            name="selling_price_mrp" // ✅ Changed from 'selling_price'
            placeholder="MRP" // ✅ Changed from 'Selling Price'
            type="number" 
            value={formData.selling_price_mrp} // ✅ Changed from 'selling_price'
            onChange={handleChange} 
            required 
          />
          <input name="gst_rate" placeholder="GST Rate" type="number" value={formData.gst_rate} onChange={handleChange} required />

          <div className="modal-buttons">
            <button type="submit" className="add-btn">Add</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddItemModal;