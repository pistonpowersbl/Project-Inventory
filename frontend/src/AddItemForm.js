import React, { useState } from "react";
import axios from "axios";

const AddItemForm = ({ onItemAdded }) => {
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
    rack_no: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'rack_no' ? value.toUpperCase() : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Sending to backend:", formData);
      console.log("POST URL:", "http://localhost:5000/api/items");
      const response = await axios.post("http://localhost:5000/api/items", formData);
      if (response.status === 200 || response.status === 201) {
        alert("✅ Item added successfully!");
        onItemAdded(response.data);
        setFormData({
          code: "",
          hsn_code: "", // ✅ Added new field
          company_name: "", // ✅ Changed from 'name'
          category: "",
          sub_category: "",
          quantity: "",
          purchase_price: "",
          selling_price_mrp: "", // ✅ Changed from 'selling_price'
          gst_rate: "",
          rack_no: "",
        });
      } else {
        alert("❌ Failed to add item.");
      }
    } catch (error) {
      if (
        error.response &&
        error.response.status === 409 &&
        error.response.data &&
        error.response.data.message === "Item already exists"
      ) {
        alert("❌ Item already exists...");
      } else {
        alert("❌ Error adding item.");
        console.error("Add item error:", error);
      }
    }
  };  

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="code"
        placeholder="Code" // ✅ Changed from "HSN Code / Code"
        value={formData.code}
        onChange={handleChange}
        className="border p-2"
        required
      />
      <input
        type="text"
        name="hsn_code" 
        placeholder="HSN Code" 
        value={formData.hsn_code}
        onChange={handleChange}
        className="border p-2"
      />
      <input
        name="company_name" // ✅ Changed from 'name'
        value={formData.company_name} // ✅ Changed from 'name'
        onChange={handleChange}
        placeholder="Company Name" // ✅ Changed from 'Item Name'
        required
      />
      <input
        name="category"
        value={formData.category}
        onChange={handleChange}
        placeholder="Category"
      />
      <input
        name="sub_category"
        value={formData.sub_category}
        onChange={handleChange}
        placeholder="Sub Category"
      />
      <input
        name="quantity"
        type="number"
        value={formData.quantity}
        onChange={handleChange}
        placeholder="Quantity"
      />
      <input
        name="purchase_price"
        type="number"
        value={formData.purchase_price}
        onChange={handleChange}
        placeholder="Purchase Price"
      />
      <input
        name="selling_price_mrp" // ✅ Changed from 'selling_price'
        type="number"
        value={formData.selling_price_mrp} // ✅ Changed from 'selling_price'
        onChange={handleChange}
        placeholder="Selling Price/MRP" // ✅ Changed from 'Selling Price'
      />
      <input
        name="gst_rate"
        type="number"
        value={formData.gst_rate}
        onChange={handleChange}
        placeholder="GST %"
      />
      <input
  type="text"
  name="rack_no"
  placeholder="Rack No (e.g., RACK-01)"  // More descriptive placeholder
  value={formData.rack_no}
  onChange={handleChange}
  className="border p-2"
  pattern="[A-Z0-9-]+"  // Allows only uppercase letters, numbers, and hyphens
  title="Only letters, numbers, and hyphens allowed"
/>
      <button type="submit">Add Item</button>
    </form>
  );
};

export default AddItemForm;