import React, { useState, useEffect } from "react";
import axios from "axios";

function SalesEntry() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    code: "",
    name: "",
    category: "",
    subcategory: "",
    purchase_price: "",
    selling_price: "",
    quantity: "",
  });

  const [items, setItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/items");
        setItems(response.data);
      } catch (error) {
        console.error("Failed to fetch items:", error);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    const matchedItem = items.find(
      (item) =>
        item.code?.toLowerCase() === formData.code.toLowerCase() &&
        item.name?.toLowerCase() === formData.name.toLowerCase() &&
        item.category?.toLowerCase() === formData.category.toLowerCase() &&
        item.sub_category?.toLowerCase() === formData.subcategory.toLowerCase()
    );

    if (matchedItem) {
      setFormData((prev) => ({
        ...prev,
        purchase_price: matchedItem.purchase_price || "",
        selling_price: matchedItem.selling_price || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        purchase_price: "",
        selling_price: "",
      }));
    }
  }, [formData.code, formData.name, formData.category, formData.subcategory, items]);

  useEffect(() => {
    const qty = parseFloat(formData.quantity);
    const price = parseFloat(formData.selling_price);
    if (!isNaN(qty) && !isNaN(price)) {
      setTotalAmount(qty * price);
    } else {
      setTotalAmount(0);
    }
  }, [formData.quantity, formData.selling_price]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const payload = {
      ...formData,
      total_amount: totalAmount,
    };
  
    console.log("✅ Payload being sent:", payload); // 👈 This logs the full payload before sending
  
    try {
      const response = await axios.post("http://localhost:5000/api/sales", payload);
      alert(response.data.message || "✅ Sale recorded and saved to DB.");
    } catch (error) {
      console.error("❌ Save failed:", error);
      alert("❌ Failed to save sale entry.");
    }
  };
  

  return (
    <div style={{ padding: "20px" }}>
      <h2>📝 Sales Entry</h2>
      <form onSubmit={handleSubmit}>
        <label>Date:</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} /><br />

        <label>Code:</label>
        <input name="code" value={formData.code} onChange={handleChange} /><br />

        <label>Name:</label>
        <input name="name" value={formData.name} onChange={handleChange} /><br />

        <label>Category:</label>
        <input name="category" value={formData.category} onChange={handleChange} /><br />

        <label>Subcategory:</label>
        <input name="subcategory" value={formData.subcategory} onChange={handleChange} /><br />

        <label>Purchase Price:</label>
        <input name="purchase_price" value={formData.purchase_price} readOnly /><br />

        <label>Selling Price:</label>
        <input name="selling_price" value={formData.selling_price} readOnly /><br />

        <label>Quantity:</label>
        <input name="quantity" value={formData.quantity} onChange={handleChange} /><br />

        <label>Total Amount:</label>
        <input value={totalAmount.toFixed(2)} readOnly /><br /><br />

        <button type="submit">💾 Save Entry</button>
      </form>
    </div>
  );
}

export default SalesEntry;
