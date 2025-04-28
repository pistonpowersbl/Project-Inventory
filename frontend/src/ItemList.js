import React, { useState } from "react";
import EditItemModal from "./EditItemModal";
import { Button, Space, Table, Input } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const DeleteConfirmationModal = ({ item, onConfirm, onCancel }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90%'
      }}>
        <h3 style={{ marginTop: 0 }}>Confirm Deletion</h3>
        <p>Are you sure you want to delete:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Company:</strong> {item.company_name}</li>
          <li><strong>Category:</strong> {item.category}</li>
          <li><strong>Subcategory:</strong> {item.sub_category}</li>
        </ul>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" danger onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
};

const ItemList = ({ items, onDelete, onUpdate, onEdit }) => {
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleEditClick = (item) => {
    onEdit(item);
  };

  const closeModal = () => {
    setEditingItem(null);
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.code && item.code.toLowerCase().includes(term)) ||
      (item.hsn_code && item.hsn_code.toLowerCase().includes(term)) ||
      item.company_name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.sub_category.toLowerCase().includes(term) ||
      (item.rack_no && item.rack_no.toLowerCase().includes(term))
    );
  });

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      align: 'center'
    },
    {
      title: 'HSN Code',
      dataIndex: 'hsn_code',
      key: 'hsn_code',
      align: 'center',
      render: (text) => text || '-'
    },
    {
      title: 'Company Name',
      dataIndex: 'company_name',
      key: 'company_name',
      align: 'center'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      align: 'center'
    },
    {
      title: 'Subcategory',
      dataIndex: 'sub_category',
      key: 'sub_category',
      align: 'center'
    },
    {
      title: 'Rack No.',
      dataIndex: 'rack_no',
      key: 'rack_no',
      align: 'center',
      render: (text) => text || '-'
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center'
    },
    {
      title: 'Purchase Price',
      dataIndex: 'purchase_price',
      key: 'purchase_price',
      align: 'center',
      render: (text) => parseFloat(text || 0).toFixed(2)
    },
    {
      title: 'MRP',
      dataIndex: 'selling_price_mrp',
      key: 'selling_price_mrp',
      align: 'center',
      render: (text) => parseFloat(text || 0).toFixed(2)
    },
    {
      title: 'GST Rate',
      dataIndex: 'gst_rate',
      key: 'gst_rate',
      align: 'center',
      render: (text) => `${text}%`
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => handleEditClick(record)}
            style={{ backgroundColor: '#1890ff' }}
          />
          <Button 
            type="primary" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => setItemToDelete(record)}
          />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Inventory Items
      </h2>

      <Input
        placeholder="Search by code, HSN code, company name, category, or rack no"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          marginBottom: "1rem",
          width: "100%"
        }}
      />
      
      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize: 20,
          onChange: (page) => setCurrentPage(page),
          showSizeChanger: false,
          showQuickJumper: false,
          position: ['bottomCenter'],
          style: { marginTop: '16px' }
        }}
        style={{ marginTop: "10px" }}
      />

      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={closeModal}
          onUpdate={onUpdate}
        />
      )}

      {itemToDelete && (
        <DeleteConfirmationModal
          item={itemToDelete}
          onConfirm={() => {
            onDelete(itemToDelete.id);
            setItemToDelete(null);
          }}
          onCancel={() => setItemToDelete(null)}
        />
      )}
    </div>
  );
};

export default ItemList;