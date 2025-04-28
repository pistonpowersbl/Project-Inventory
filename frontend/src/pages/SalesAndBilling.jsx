import React, { useState } from "react";

const SalesAndBilling = () => {
  const [activeTab, setActiveTab] = useState("sales");

  return (
    <div style={{ padding: "20px" }}>
      <h1>Sales and Billing</h1>
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setActiveTab("sales")}>
          Sales Entry
        </button>
        <button onClick={() => setActiveTab("invoice")} style={{ marginLeft: "10px" }}>
          Generate Invoice
        </button>
      </div>

      {activeTab === "sales" ? (
        <div>
          <h2>Sales Entry Form</h2>
          {/* We'll add the form here later */}
        </div>
      ) : (
        <div>
          <h2>Generate Invoice</h2>
          {/* We'll add the invoice form here later */}
        </div>
      )}
    </div>
  );
};

export default SalesAndBilling;
