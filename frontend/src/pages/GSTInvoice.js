import React, { useState, useEffect } from "react";
import { Table, Input, Button, DatePicker, Form, Row, Col, Select, Radio, InputNumber, message, Space } from "antd";
import { useInventory } from "../context/InventoryProvider";
import dayjs from 'dayjs';
// import axios from 'axios';
// import { jsPDF } from "jspdf";

const { Option } = Select;

function GSTInvoice() {
  const { items, loading } = useInventory();
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceCounter, /*setInvoiceCounter*/] = useState(1);
  const [/*formValues*/, /*setFormValues*/] = useState({
    invoiceNumber: '',
    date: new Date().toISOString(),
    customerName: '',
    contactNumber: '',
    address: '',
    gstin: ''
  });
  const [formItems, setFormItems] = useState([]);
  useEffect(() => {
    console.log("Current formItems state:", formItems);
  }, [formItems]);
  const [form] = Form.useForm();
  const pageSize = 10;

  // Generate invoice number (INV-DDMMYYYY-01)
  const generateInvoiceNumber = () => {
    const dateStr = dayjs().format('DDMMYYYY');
    return `INV-${dateStr}-${invoiceCounter.toString().padStart(2, '0')}`;
  };

  //Invoice generation function
  const generateInvoice = async () => {
    if (formItems.length === 0) {
      message.error('Please add at least one item');
      return;
    }

    const incompleteItems = formItems.filter(item => !item.code || !item.quantity);
    if (incompleteItems.length > 0) {
      message.error('Please complete all item details');
      return;
    }

    const invalidItems = formItems.filter(item =>
      item.unitRate === undefined ||
      item.taxableValue === undefined ||
      item.total === undefined
    );

    if (invalidItems.length > 0) {
      console.error("Invalid items found:", invalidItems);
      message.error("Some items have missing values. Check console.");
      return;
    }

    const format = (num) => isNaN(num) ? '0.00' : Number(num).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const invoiceNumber = form.getFieldValue('invoiceNumber') || `INV-${new Date().getDate()}${(new Date().getMonth() + 1)}${new Date().getFullYear()}-01`;
    const invoiceDate = form.getFieldValue('date') ? new Date(form.getFieldValue('date')).toLocaleDateString() : new Date().toLocaleDateString();

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // === Header ===
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("PISTON POWER", 15, 15);
    doc.text("TAX INVOICE", 195, 15, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text("SPARES | BATTERIES | INVERTERS", 15, 21);
    doc.text("1823 A, Amaravathy Road, Chirattapalam, Fort Kochi, Cohcin -1 | +91-6282890139 | pistonpowersbl@gmail.com", 15, 26);
    doc.text("State - Kerala | Code - 32 | GSTN - 32ABGFP7311J1ZB", 15, 31);

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277); // Border for the whole page
    doc.line(10, 35, 200, 35);  // Horizontal separator

    // === Invoice & Buyer Details ===
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Invoice No: ${invoiceNumber}`, 15, 42);
    doc.text(`Date : ${invoiceDate}`, 170, 42);

    doc.setFont(undefined, 'bold');
    doc.text('Buyer Details :', 15, 50);
    doc.setFont(undefined, 'normal');
    doc.text('Name :', 15, 56);
    doc.line(32, 56.5, 90, 56.5);
    doc.text('Contact :', 15, 62);
    doc.line(37, 62.5, 90, 62.5);
    doc.text('Address :', 15, 68);
    doc.line(39, 68.5, 90, 68.5);
    doc.text('GSTN :', 15, 74);
    doc.line(30, 74.5, 90, 74.5);

    // === Table ===
    const headers = [
      "No.", "Description", "HSN", "Qty", "Rate (₹)",
      "Taxable Value (₹)", "GST%", "CGST (₹)", "SGST (₹)", "Total (₹)"
    ];
    const colX = [10, 22, 78, 96, 108, 126, 146, 158, 170, 182, 200];
    const colWidths = [12, 56, 18, 12, 18, 20, 12, 12, 12, 18];
    let y = 82;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    headers.forEach((h, i) => doc.text(h, colX[i] + 1, y));
    doc.setDrawColor(0);
    doc.line(10, y + 2, 200, y + 2); // header bottom
    y += 6;

    doc.setFont(undefined, 'normal');
    const maxRows = 15;
    for (let i = 0; i < maxRows; i++) {
      let item = formItems[i];
      let rowY = y + i * 10;
      // Draw row borders with safety checks
      for (let c = 0; c < colX.length; c++) {
        const x = Number(colX[c]);
        const yRect = Number(rowY - 6);
        const w = Number(colWidths[c]);
        const h = 10;
        if ([x, yRect, w, h].every(v => typeof v === 'number' && !isNaN(v))) {
          doc.rect(x, yRect, w, h);
        }
      }
      if (item) {
        doc.text(String(i + 1), colX[0] + 1, rowY);
        // Description wrapping
        let desc = `${item.companyName || ''} | ${item.category || ''} | ${item.subCategory || ''}`;
        let descLines = doc.splitTextToSize(desc, colWidths[1] - 2);
        doc.text(descLines, colX[1] + 1, rowY);
        doc.text(item.hsnCode || '', colX[2] + 1, rowY);
        doc.text(item.quantity?.toString() || '0', colX[3] + 1, rowY);
        doc.text(format(item.unitRate), colX[4] + 1, rowY);
        doc.text(format(item.taxableValue), colX[5] + 1, rowY);
        doc.text(`${item.gstRate || 0}%`, colX[6] + 1, rowY);
        doc.text(format(item.cgst), colX[7] + 1, rowY);
        doc.text(format(item.sgst), colX[8] + 1, rowY);
        doc.text(format(item.total), colX[9] + 1, rowY);
      }
    }

    // === Totals Section ===
    let totalsY = y + maxRows * 10 + 5;
    doc.setFont(undefined, 'normal');
    doc.text('Taxable Value :', 140, totalsY);
    doc.line(165, totalsY + 0.5, 200, totalsY + 0.5);
    doc.text('CGST :', 140, totalsY + 7);
    doc.line(153, totalsY + 7.5, 200, totalsY + 7.5);
    doc.text('SGST :', 140, totalsY + 14);
    doc.line(153, totalsY + 14.5, 200, totalsY + 14.5);
    doc.setFont(undefined, 'bold');
    doc.text('Grand Total :', 140, totalsY + 21);
    doc.line(165, totalsY + 21.5, 200, totalsY + 21.5);
    doc.setFont(undefined, 'normal');
    doc.text('(Grand total in words)', 140, totalsY + 28);

    // === Footer ===
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Declaration :', 15, 265);
    doc.setFont(undefined, 'normal');
    doc.text('We declare that this invoice shows the actual price of the goods described', 15, 270);
    doc.text('and that all particulars are true and correct. The amount of tax charged in', 15, 275);
    doc.text('this invoice is payable under the provisions of the Goods and Services Tax Act, 2017.', 15, 280);

    doc.setFont(undefined, 'bold');
    doc.text('For Piston Power', 150, 265);
    doc.setFont(undefined, 'normal');
    doc.text('Authorized Signatory', 150, 280);

    // === Finalize ===
    const pdfUrl = URL.createObjectURL(doc.output('blob'));
    window.open(pdfUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
  };

  // Filter items based on search text
  const filteredItems = items.filter(item =>
    item.code.toLowerCase().includes(searchText.toLowerCase()) ||
    item.hsn_code.toLowerCase().includes(searchText.toLowerCase()) ||
    item.company_name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.category.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.sub_category ? item.sub_category.toLowerCase().includes(searchText.toLowerCase()) : false)
  );

  // Calculate totals
  const calculateTotals = () => {
    let taxableValue = 0;
    let cgst = 0;
    let sgst = 0;

    formItems.forEach(item => {
      const itemValue = item.taxableValue || 0;
      taxableValue += itemValue;
      cgst += itemValue * (item.gstRate / 200); // GST/2 for CGST
      sgst += itemValue * (item.gstRate / 200); // GST/2 for SGST
    });

    return {
      taxableValue: taxableValue.toFixed(2),
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      grandTotal: (taxableValue + cgst + sgst).toFixed(2)
    };
  };

  const totals = calculateTotals();

  // Add new item to form
  const addItem = () => {
    const newKey = Date.now();
    const newItem = {
      key: newKey,
      code: '',
      hsnCode: '',
      companyName: '',
      category: '',
      subCategory: '',
      gstRate: 0,
      quantity: 1,
      unitRate: 0,
      taxableValue: 0,
      cgst: 0,
      sgst: 0,
      total: 0,
      useManualValue: false
    };
  
    setFormItems([...formItems, newItem]);
  
    // Auto-scroll to the new item after it's rendered
    setTimeout(() => {
      const element = document.getElementById(`item-${newKey}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
        
        // Optional: Highlight the new item temporarily
        element.style.transition = 'box-shadow 0.3s';
        element.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.3)';
        setTimeout(() => {
          element.style.boxShadow = 'none';
        }, 2000);
      }
    }, 100);
  };

  // Remove item from form
  const removeItem = (key) => {
    setFormItems(formItems.filter(item => item.key !== key));
  };

  // Handle item field changes
  const handleItemChange = (key, field, value) => {
    setFormItems(formItems.map(item => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value };
        
        // Case 1: Code changed → auto-fetch all values
        if (field === 'code' && value) {
          const inventoryItem = items.find(i => i.code === value);
          
          if (inventoryItem) {
            updatedItem.hsnCode = inventoryItem.hsn_code;
            updatedItem.companyName = inventoryItem.company_name;
            updatedItem.category = inventoryItem.category;
            updatedItem.subCategory = inventoryItem.sub_category;
            updatedItem.gstRate = parseFloat(inventoryItem.gst_rate) || 0;
            
            // Set unit rate (base price before GST)
            const mrp = parseFloat(inventoryItem.selling_price_mrp);
            updatedItem.unitRate = parseFloat((mrp / (1 + (updatedItem.gstRate / 100)).toFixed(2)));
            
            // Auto-calculate if not in manual mode
            if (!updatedItem.useManualValue) {
              updatedItem.taxableValue = parseFloat(
                (mrp / (1 + (updatedItem.gstRate / 100)) * (updatedItem.quantity || 1)
              ).toFixed(2));
            }
            
            // Calculate taxes (store as numbers)
            updatedItem.cgst = parseFloat(
              (updatedItem.taxableValue * updatedItem.gstRate / 200).toFixed(2)
            );
            updatedItem.sgst = parseFloat(
              (updatedItem.taxableValue * updatedItem.gstRate / 200).toFixed(2)
            );
            updatedItem.total = parseFloat(
              (parseFloat(updatedItem.taxableValue || 0) + 
              parseFloat(updatedItem.cgst || 0) + 
              parseFloat(updatedItem.sgst || 0)
            ).toFixed(2));
          }
        }
  
        // Case 2: Switched from Manual → Auto
        if (field === 'useManualValue' && value === false) {
          const inventoryItem = items.find(i => i.code === item.code);
          if (inventoryItem) {
            const mrp = parseFloat(inventoryItem.selling_price_mrp);
            updatedItem.taxableValue = parseFloat(
              (mrp / (1 + (updatedItem.gstRate / 100)) * (updatedItem.quantity || 1)
            ).toFixed(2));
          }
        }
  
        // Case 3: Quantity changed
        if (field === 'quantity') {
          const inventoryItem = items.find(i => i.code === item.code);
          if (inventoryItem && !updatedItem.useManualValue) {
            const mrp = parseFloat(inventoryItem.selling_price_mrp);
            updatedItem.taxableValue = parseFloat(
              (mrp / (1 + (updatedItem.gstRate / 100)) * value
            ).toFixed(2));
          } else if (updatedItem.useManualValue) {
            // For manual mode, maintain the same taxable value per unit
            const perUnitValue = updatedItem.taxableValue / (item.quantity || 1);
            updatedItem.taxableValue = parseFloat(
              (perUnitValue * value).toFixed(2)
            );
          }
        }
  
        // Always recalculate taxes when relevant fields change
        if (['quantity', 'taxableValue', 'gstRate', 'useManualValue'].includes(field)) {
          updatedItem.cgst = parseFloat(
            (updatedItem.taxableValue * updatedItem.gstRate / 200).toFixed(2)
          );
          updatedItem.sgst = parseFloat(
            (updatedItem.taxableValue * updatedItem.gstRate / 200).toFixed(2)
          );
          updatedItem.total = parseFloat(
            (parseFloat(updatedItem.taxableValue || 0) + 
            parseFloat(updatedItem.cgst || 0) + 
            parseFloat(updatedItem.sgst || 0)
          ).toFixed(2));
        }
  
        return updatedItem;
      }
      return item;
    }));
  };

  // Handle form submission
  // const handleSubmit = () => {
  //   form.validateFields().then(values => {
  //     setInvoiceCounter(invoiceCounter + 1);
  //     setShowInvoiceForm(false);
  //   });
  // };

  // Original table columns (unchanged)
  const columns = [
    { title: "Code", dataIndex: "code", key: "code" },
    { title: "HSN Code", dataIndex: "hsn_code", key: "hsn_code" },
    { title: "Company Name", dataIndex: "company_name", key: "company_name" },
    { title: "Category", dataIndex: "category", key: "category" },
    { 
      title: "Subcategory", 
      dataIndex: "sub_category",
      key: "sub_category",
      render: (text) => text ? text : "-"
    },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Purchase Price", dataIndex: "purchase_price", key: "purchase_price" },
    { 
      title: "MRP", 
      dataIndex: "selling_price_mrp",
      key: "selling_price_mrp",
      render: (text) => (text !== undefined && text !== null && text !== "") ? text : "-"
    },
    { title: "GST Rate", dataIndex: "gst_rate", key: "gst_rate" },
    { 
      title: "Taxable Value",
      key: "taxable_value",
      render: (_, record) => {
        const mrp = parseFloat(record.selling_price_mrp);
        const gstRate = parseFloat(record.gst_rate);
        
        if (!mrp || !gstRate || isNaN(mrp) || isNaN(gstRate)) return "-";
        
        const taxableValue = mrp / (1 + (gstRate / 100));
        return `₹${taxableValue.toFixed(2)}`;
      }
    }
  ];

  return (
    <div className="App">
      <h1>GST Invoice</h1>
      
      <Button 
        type={showInvoiceForm ? "default" : "primary"} 
        onClick={() => {
          setShowInvoiceForm(!showInvoiceForm);
          if (!showInvoiceForm) {
            form.resetFields();
            setFormItems([]);
          }
        }}
        style={{ marginBottom: '20px' }}
      >
        {showInvoiceForm ? 'View Items With Taxable Value' : 'Create New Invoice'}
      </Button>
  
      {showInvoiceForm ? (
        <div style={{ 
          background: '#f9f9f9', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #e8e8e8'
        }}>
          <h2>Create New Invoice</h2>
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Invoice Number">
                  <Input value={generateInvoiceNumber()} readOnly />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="Date" 
                  name="date" 
                  initialValue={dayjs()}
                  rules={[{ required: true, message: 'Date is required' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ margin: '20px 0', borderTop: '1px dashed #ddd' }}></div>

            <h3>Buyer Details</h3>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item 
                  label="Customer Name" 
                  name="customerName"
                  rules={[{ required: true, message: 'Customer name is required' }]}
                >
                  <Input placeholder="Enter customer name" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Contact Number" name="contactNumber">
                  <Input placeholder="Enter contact number" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item label="Address" name="address">
                  <Input.TextArea placeholder="Enter address" rows={2} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="GSTIN (Optional)" 
                  name="gstin"
                  rules={[
                    { 
                      pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                      message: 'Invalid GSTIN format' 
                    }
                  ]}
                >
                  <Input placeholder="22AAAAA0000A1Z5" />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ margin: '20px 0', borderTop: '1px dashed #ddd' }}></div>

            <h3>Item Details</h3>
            {formItems.map((item, index) => (
              <div id={`item-${item.key}`} key={item.key} style={{ 
                padding: '16px', 
                marginBottom: '16px', 
                border: '1px solid #f0f0f0',
                borderRadius: '4px',
                transition: 'box-shadow 0.3s'
              }}>
                <div style={{ fontWeight: 500, marginBottom: 8, color: '#1890ff' }}>
      Item No: {index + 1}
    </div>
                <Row gutter={16}>
                  <Col span={4}>
                    <Form.Item label="Code">
                      <Select
                        showSearch
                        placeholder="Select code"
                        value={item.code}
                        onChange={(value) => handleItemChange(item.key, 'code', value)}
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {items.map(product => (
                          <Option key={product.code} value={product.code}>
                            {product.code}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item label="HSN Code">
                      <Input value={item.hsnCode} readOnly />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item label="Company">
                      <Input value={item.companyName} readOnly />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item label="Category">
                      <Input value={item.category} readOnly />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item label="Subcategory">
                      <Input value={item.subCategory} readOnly />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item label="GST Rate %">
                      <InputNumber 
                        value={item.gstRate} 
                        onChange={(value) => handleItemChange(item.key, 'gstRate', value)}
                        min={0}
                        max={28}
                        formatter={value => `${value}%`}
                        parser={value => value.replace('%', '')}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
  {/* First Row - Labels */}
<Col span={24}>
  <Row gutter={16}>
    <Col span={4}>
      <div style={{ paddingBottom: 8 }}>Quantity</div>
    </Col>
    <Col span={4}>
      <div style={{ paddingBottom: 8 }}>Unit Rate (₹)</div>
    </Col>
    <Col span={5}>
      <div style={{ paddingBottom: 8 }}>Taxable Value</div>
    </Col>
    <Col span={3}>
      <div style={{ paddingBottom: 8 }}>CGST (₹)</div>
    </Col>
    <Col span={3}>
      <div style={{ paddingBottom: 8 }}>SGST (₹)</div>
    </Col>
    <Col span={3}>
      <div style={{ paddingBottom: 8 }}>Total (₹)</div>
    </Col>
    <Col span={2}>
      {/* Empty column for remove button alignment */}
    </Col>
  </Row>
</Col>

{/* Second Row - Inputs */}
<Col span={24}>
  <Row gutter={16} align="middle">
    {/* Quantity */}
    <Col span={4}>
      <InputNumber 
        value={item.quantity}
        onChange={(value) => handleItemChange(item.key, 'quantity', value)}
        min={1}
        style={{ width: '100%' }}
      />
    </Col>

    {/* Unit Rate (₹) */}
    <Col span={4}>
      <InputNumber 
        value={item.unitRate || 0}
        readOnly
        style={{ width: '100%' }}
        formatter={value => `₹${value}`}
      />
    </Col>

    {/* Taxable Value - Fixed Alignment */}
    <Col span={5}>
      <Space align="center" style={{ width: '100%' }}>
        <Radio.Group 
          value={item.useManualValue}
          onChange={(e) => handleItemChange(item.key, 'useManualValue', e.target.value)}
          size="small"
          style={{ whiteSpace: 'nowrap', marginRight: 8 }}
        >
          <Radio value={false}>Auto</Radio>
          <Radio value={true}>Manual</Radio>
        </Radio.Group>
        <InputNumber 
          value={item.taxableValue || 0}
          onChange={(value) => handleItemChange(item.key, 'taxableValue', value)}
          disabled={!item.useManualValue}
          style={{ flex: 1 }}
          formatter={value => `₹${value}`}
        />
      </Space>
    </Col>

    {/* CGST */}
    <Col span={3}>
      <InputNumber 
        value={item.cgst || 0}
        readOnly
        style={{ width: '100%' }}
        formatter={value => `₹${value}`}
      />
    </Col>

    {/* SGST */}
    <Col span={3}>
      <InputNumber 
        value={item.sgst || 0}
        readOnly
        style={{ width: '100%' }}
        formatter={value => `₹${value}`}
      />
    </Col>

    {/* Total */}
    <Col span={3}>
      <InputNumber 
        value={item.total || 0}
        readOnly
        style={{ width: '100%' }}
        formatter={value => `₹${value}`}
      />
    </Col>

    {/* Remove Button */}
    <Col span={2}>
      <Button 
        danger 
        onClick={() => removeItem(item.key)}
        size="small"
        style={{ width: '100%' }}
      >
        Remove
      </Button>
    </Col>
  </Row>
</Col>
</Row>
              </div>
            ))}
{/* Add Item Button - Fixed at bottom */}
<Button type="dashed" onClick={addItem} style={{ marginTop: 16 }}>
  + Add Item
</Button>

            {formItems.length > 0 && (
              <>
                <div style={{ margin: '20px 0', borderTop: '1px dashed #ddd' }}></div>
                
                <h3 style={{ textAlign: 'center' }}>Summary</h3>
<Row gutter={16} justify="center">
  <Col span={8} style={{ textAlign: 'center' }}>
    <p><strong>Total Taxable Value:</strong> ₹{totals.taxableValue}</p>
    <p><strong>CGST:</strong> ₹{totals.cgst}</p>
    <p><strong>SGST:</strong> ₹{totals.sgst}</p>
    <p><strong>Grand Total:</strong> ₹{totals.grandTotal}</p>
  </Col>
</Row>

                <div style={{ margin: '20px 0', borderTop: '1px dashed #ddd' }}></div>

                <Form.Item>
                  <Button type="primary" onClick={generateInvoice} style={{ marginRight: 16 }}>
                    Generate Invoice
                  </Button>
                  <Button onClick={() => setShowInvoiceForm(false)}>
                    Cancel
                  </Button>
                </Form.Item>
              </>
            )}
          </Form>
        </div>
      ) : (
        <>
          <h3>Total Items in Stock: {filteredItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}</h3>
        <p style={{ color: "#6b7280", marginBottom: "0.5rem", fontWeight: "500" }}>
          Products – {items.length}{" "}
          {filteredItems.length !== items.length &&
            `(Filtered: ${filteredItems.length})`}
        </p>
        <Input
          placeholder="Search by code, HSN code, company name, category or subcategory"
          value={searchText}
          onChange={e => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
          style={{ marginBottom: 16, width: 400 }}
        />
        <Table
          dataSource={filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredItems.length,
            onChange: (page) => setCurrentPage(page),
            showTotal: (total) => `Total ${total} items`
          }}
        />
      </>
    )}
  </div>
);
}

export default GSTInvoice;