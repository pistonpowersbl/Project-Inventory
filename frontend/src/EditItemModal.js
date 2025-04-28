import React, { useState } from "react";
import axios from "axios";
import "./Modal.css";

const EditItemModal = ({ item, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({ 
    ...item,
    company_name: item.company_name || item.name || '', // ✅ Handles both old and new field names
    selling_price_mrp: item.selling_price_mrp || item.selling_price || '', // ✅ Handles both old and new field names
    hsn_code: item.hsn_code || '', // ✅ Added new field
    rack_no: item.rack_no || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:5000/api/items/${item.id}`,
        {
          ...formData,
          name: formData.company_name,
          selling_price: formData.selling_price_mrp,
          hsn_code: formData.hsn_code,
          gst_rate: formData.gst_rate,
          rack_no: formData.rack_no
        }
      );
  
      onUpdate(response.data);
      onClose();
    } catch (err) {
      console.error("Update error:", err.response?.data || err.message);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Edit Item</h2>
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
            name="company_name"
            placeholder="Company Name"
            value={formData.company_name}
            onChange={handleChange} 
            required 
          />
          <input name="category" placeholder="Category" value={formData.category} onChange={handleChange} required />
          <input name="sub_category" placeholder="Subcategory" value={formData.sub_category} onChange={handleChange} required />
          <input
            name="rack_no" // ✅ Added new field
            placeholder="Rack No."
            value={formData.rack_no}
            onChange={handleChange}
          />
          <input name="quantity" placeholder="Quantity" type="number" value={formData.quantity} onChange={handleChange} required />
          <input name="purchase_price" placeholder="Purchase Price" type="number" value={formData.purchase_price} onChange={handleChange} required />
          <input 
            name="selling_price_mrp"
            placeholder="MRP"
            type="number" 
            value={formData.selling_price_mrp}
            onChange={handleChange} 
            required 
          />
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