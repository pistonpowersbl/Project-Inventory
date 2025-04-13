import React, { useState } from "react";
import EditItemModal from "./EditItemModal";

const ItemList = ({ items, onDelete, onUpdate, onEdit }) => {
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleEditClick = (item) => {
    onEdit(item); // This will correctly update the selected item and open the modal
  };

  const closeModal = () => {
    setEditingItem(null);
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.code && item.code.toLowerCase().includes(term)) || // ✅ added this
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.sub_category.toLowerCase().includes(term)
    );
  });

  const itemsPerPage = 20;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Inventory Items</h2>
      <p className="text-gray-600 mb-2 font-medium">
        Items – {items.length}{" "}
        {filteredItems.length !== items.length &&
          `(Filtered: ${filteredItems.length})`}
      </p>

      <input
        type="text"
        placeholder="Search by name, category, or subcategory"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 px-4 py-2 border border-gray-300 rounded w-full"
      />
      <table className="table-auto w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">HSN Code / Code</th>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Category</th>
            <th className="border px-4 py-2">Subcategory</th>
            <th className="border px-4 py-2">Quantity</th>
            <th className="border px-4 py-2">Purchase Price</th>
            <th className="border px-4 py-2">Selling Price</th>
            <th className="border px-4 py-2">GST Rate</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item) => (
            <tr key={item.id}>
              <td className="border px-4 py-2">{item.code}</td>
              <td className="border px-4 py-2">{item.name}</td>
              <td className="border px-4 py-2">{item.category}</td>
              <td className="border px-4 py-2">{item.sub_category}</td>
              <td className="border px-4 py-2">{item.quantity}</td>
              <td className="border px-4 py-2">{item.purchase_price}</td>
              <td className="border px-4 py-2">{item.selling_price}</td>
              <td className="border px-4 py-2">{item.gst_rate}%</td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => onDelete(item.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 mr-2"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleEditClick(item)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === index + 1
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={closeModal}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

export default ItemList;
