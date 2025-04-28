const express = require("express");
module.exports = function (pool) {
  const router = express.Router();

  router.get("/test", (req, res) => {
    res.send("Sales route is working ✅");
  });

  // GET all sales
  router.get("/", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT * FROM sales ORDER BY date DESC`
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ error: "Failed to fetch sales data." });
    }
  });

  // POST new sale
  router.post("/", async (req, res) => {
    const {
      date,
      code,
      hsn_code,
      company_name,
      category,
      subcategory,
      purchase_price,
      selling_price_mrp,
      quantity,
      discount = 0,
      total_amount,
    } = req.body;

    if (!company_name || !quantity) {
      return res.status(400).json({ error: "Company name and quantity are required" });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insert sale record
      const saleResult = await client.query(
        `INSERT INTO sales 
          (date, code, hsn_code, company_name, category, subcategory, 
           purchase_price, selling_price_mrp, quantity, discount, total_amount) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          date,
          code,
          hsn_code || null,
          company_name,
          category,
          subcategory,
          purchase_price,
          selling_price_mrp,
          quantity,
          discount,
          total_amount,
        ]
      );

      // 2. Update inventory (ONLY FOR REGULAR SALES)
      const updateResult = await client.query(
        `UPDATE items 
         SET quantity = quantity - $1 
         WHERE code = $2
         RETURNING *`,
        [quantity, code]
      );

      if (updateResult.rows.length === 0) {
        throw new Error('Item not found in inventory');
      }

      await client.query('COMMIT');
      res.status(201).json({ 
        sale: saleResult.rows[0],
        updatedItem: updateResult.rows[0],
        message: "✅ Sale recorded and inventory updated" 
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Error in sales entry:", error.message);
      
      res.status(500).json({ 
        error: "Failed to save sales entry.",
        details: error.message 
      });
    } finally {
      client.release();
    }
  });

  // PUT (Update) existing sale
  router.put("/:id", async (req, res) => {
    const saleId = req.params.id;
    const {
      date,
      code,
      hsn_code,
      company_name,
      category,
      subcategory,
      purchase_price,
      selling_price_mrp,
      quantity,
      discount,
      total_amount
    } = req.body;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Get the original sale to check quantity differences
      const originalSale = await client.query(
        'SELECT * FROM sales WHERE id = $1', 
        [saleId]
      );

      if (originalSale.rows.length === 0) {
        return res.status(404).json({ error: "Sale not found" });
      }

      const originalQty = originalSale.rows[0].quantity;
      const qtyDifference = quantity - originalQty;

      // 2. Update the sale record
      const updateResult = await client.query(
        `UPDATE sales SET
          date = $1,
          code = $2,
          hsn_code = $3,
          company_name = $4,
          category = $5,
          subcategory = $6,
          purchase_price = $7,
          selling_price_mrp = $8,
          quantity = $9,
          discount = $10,
          total_amount = $11
        WHERE id = $12
        RETURNING *`,
        [
          date,
          code,
          hsn_code || null,
          company_name,
          category,
          subcategory,
          purchase_price,
          selling_price_mrp,
          quantity,
          discount,
          total_amount,
          saleId
        ]
      );

      // 3. Update inventory if quantity changed
      if (qtyDifference !== 0) {
        await client.query(
          `UPDATE items 
           SET quantity = quantity - $1 
           WHERE code = $2`,
          [qtyDifference, code]
        );
      }

      await client.query('COMMIT');
      res.json({ 
        sale: updateResult.rows[0],
        message: "✅ Sale updated successfully" 
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Error updating sale:", error);
      res.status(500).json({ 
        error: "Failed to update sale",
        details: error.message 
      });
    } finally {
      client.release();
    }
  });

  // DELETE sale
  router.delete("/:id", async (req, res) => {
    const saleId = req.params.id;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Get the sale to restore inventory
      const saleResult = await client.query(
        'SELECT * FROM sales WHERE id = $1', 
        [saleId]
      );

      if (saleResult.rows.length === 0) {
        return res.status(404).json({ error: "Sale not found" });
      }

      const sale = saleResult.rows[0];

      // 2. Restore inventory
      await client.query(
        `UPDATE items 
         SET quantity = quantity + $1 
         WHERE code = $2`,
        [sale.quantity, sale.code]
      );

      // 3. Delete the sale
      await client.query(
        'DELETE FROM sales WHERE id = $1',
        [saleId]
      );

      await client.query('COMMIT');
      res.json({ 
        message: "✅ Sale deleted successfully",
        restoredQuantity: sale.quantity,
        itemCode: sale.code
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Error deleting sale:", error);
      res.status(500).json({ 
        error: "Failed to delete sale",
        details: error.message 
      });
    } finally {
      client.release();
    }
  });

  // ============ GST INVOICE ENDPOINTS ============ //
  router.get("/gst-invoice/items/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const result = await pool.query(
        `SELECT 
          code,
          hsn_code,
          company_name,
          category,
          sub_category as subcategory,
          selling_price_mrp,
          gst_rate as gst
         FROM items 
         WHERE code = $1`, 
        [code]
      );
      
      if (!result.rows[0]) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error("GST Product Lookup Error:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  router.post("/gst-invoice", async (req, res) => {
    const client = await pool.connect();
    
    try {
      const { 
        customer_details, 
        items, 
        payment_mode, 
        purchase_mode 
      } = req.body;

      await client.query('BEGIN');

      // 1. Save invoice master data
      const invoiceResult = await client.query(
        `INSERT INTO gst_invoices 
          (customer_name, customer_address, customer_gstin, customer_phone,
           payment_mode, purchase_mode, subtotal, total_tax, total_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          customer_details.name,
          customer_details.address,
          customer_details.gstin || null,
          customer_details.phone,
          payment_mode,
          purchase_mode,
          req.body.subtotal,
          req.body.total_tax,
          req.body.total_amount
        ]
      );

      const invoiceId = invoiceResult.rows[0].id;

      // 2. Save invoice items (NO inventory update for GST invoices)
      for (const item of items) {
        await client.query(
          `INSERT INTO gst_invoice_items 
            (invoice_id, product_code, description, hsn_code, 
             quantity, rate, taxable_value, gst_percent, cgst, sgst, total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            invoiceId,
            item.code,
            `${item.company_name} | ${item.category} | ${item.subcategory}`,
            item.hsn_code,
            item.quantity,
            item.rate,
            item.taxable_value,
            item.gst,
            item.cgst,
            item.sgst,
            item.total
          ]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ 
        success: true,
        invoice_id: invoiceId,
        message: "✅ GST invoice created successfully" 
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error("GST Invoice Error:", error);
      res.status(500).json({ 
        error: "Failed to create GST invoice",
        details: error.message 
      });
    } finally {
      client.release();
    }
  });

  return router;
};