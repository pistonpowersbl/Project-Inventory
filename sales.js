const express = require("express");

module.exports = function (pool) {
  const router = express.Router();

  // ✅ Test route to verify sales route is working
  router.get("/test", (req, res) => {
    res.send("Sales route is working ✅");
  });

  // Get all sales entries
  router.get("/", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM sales ORDER BY date DESC");
      res.json(result.rows);  // Send the list of sales
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ error: "Failed to fetch sales data." });
    }
  });

  // POST a new sale
  router.post("/", async (req, res) => {
    const {
      date,
      code,
      name,
      category,
      subcategory,
      purchase_price,
      selling_price,
      quantity,
      total_amount,
    } = req.body;

    try {
      const insertQuery = `
        INSERT INTO sales 
          (date, code, name, category, subcategory, purchase_price, selling_price, quantity, total_amount) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      await pool.query(insertQuery, [
        date,
        code,
        name,
        category,
        subcategory,
        purchase_price,
        selling_price,
        quantity,
        total_amount,
      ]);

      const updateQuery = `
        UPDATE items 
        SET quantity = quantity - $1 
        WHERE code = $2 AND name = $3 AND category = $4 AND sub_category = $5
      `;
      await pool.query(updateQuery, [quantity, code, name, category, subcategory]);

      res.status(200).json({ message: "✅ Sale recorded and inventory updated." });
    } catch (error) {
      console.error("Error in sales entry:", error.message);
      res.status(500).json({ error: "Failed to save sales entry." });
    }
  });

  return router;
};
