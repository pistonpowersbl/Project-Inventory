import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import SalesEntry from "./SalesEntry";

function SalesAndBilling() {
  return (
    <div>
      <h1>Sales and Billing</h1>
      <nav style={{ marginBottom: "20px" }}>
        <Link to="sales-entry" style={{ marginRight: "15px" }}>📝 Sales Entry</Link>
        <Link to="gst-invoice">🧾 GST Invoice</Link> {/* We'll create this later */}
      </nav>

      <Routes>
        <Route path="sales-entry" element={<SalesEntry />} />
        {/* Placeholder route for future GST Invoice */}
        <Route path="gst-invoice" element={<p>GST Invoice page coming soon...</p>} />
        {/* Fallback */}
        <Route path="*" element={<p>Please choose a sub-page above.</p>} />
      </Routes>
    </div>
  );
}

export default SalesAndBilling;
