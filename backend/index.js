const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Added OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false // Explicitly handle OPTIONS
}));
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
})

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Store connected clients for SSE
const clients = new Set();

// SSE endpoint
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Add this client to the set
  clients.add(res);

  // Remove client when they disconnect
  req.on('close', () => {
    clients.delete(res);
  });
});

// Helper function to send events to all connected clients
const sendEventToClients = (type, data) => {
  const event = JSON.stringify({ type, data });
  clients.forEach(client => {
    client.write(`data: ${event}\n\n`);
  });
};

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: process.env.DB_PORT
});

pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('🔥 DATABASE CONNECTION ERROR:', err.message);
  } else {
    console.log('✅ PostgreSQL Connected');
  }
});

// Create transactions table
async function createTransactionsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        type VARCHAR(20) NOT NULL,
        description TEXT,
        amount NUMERIC(15, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Transactions table ready");
  } catch (err) {
    console.error("❌ Error creating transactions table:", err);
  }
}
createTransactionsTable();

// API Endpoints for Transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM transactions ORDER BY date DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post('/api/transactions', async (req, res) => {
  const { date, type, description, amount } = req.body;
  
  try {
    const { rows } = await pool.query(
      `INSERT INTO transactions (date, type, description, amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [date, type, description, amount]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: "Invalid transaction data" });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

// ➡️ 1. Create calculations table (run once)
// 1. Create simplified calculations table
async function createCalculationsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cash_credit_calculations (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        principal NUMERIC(15, 2) NOT NULL,
        interest_rate NUMERIC(5, 2) NOT NULL,
        days INTEGER NOT NULL,
        calculated_interest NUMERIC(15, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Calculations table ready");
  } catch (err) {
    console.error("❌ Error creating table:", err);
  }
}
createCalculationsTable();

// 2. API Endpoints (No Authentication)
app.get('/api/calculations', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM cash_credit_calculations ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch calculations" });
  }
});

app.post('/api/calculations', async (req, res) => {
  const { principal, interest_rate, days, date } = req.body;
  const calculated_interest = (principal * interest_rate * days) / 36500;

  try {
    const { rows } = await pool.query(
      `INSERT INTO cash_credit_calculations 
       (date, principal, interest_rate, days, calculated_interest)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [date, principal, interest_rate, days, calculated_interest]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: "Invalid calculation data" });
  }
});

app.delete('/api/calculations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First verify the calculation exists
    const { rowCount } = await pool.query(
      'SELECT id FROM cash_credit_calculations WHERE id = $1', 
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Calculation not found" });
    }

    // Then delete it
    await pool.query(
      'DELETE FROM cash_credit_calculations WHERE id = $1', 
      [id]
    );

    res.status(204).send();
  } catch (err) {
    console.error('Delete calculation error:', err);
    res.status(500).json({ 
      error: "Failed to delete calculation",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.post("/api/register", async (req, res) => {
  const { username, password, email } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const result = await pool.query(
      `INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *`,
      [username, hashedPassword, email]
    );

    res.status(201).json({ message: "User registered successfully", user: result.rows[0] });
  } catch (err) {
    console.error("🔥 Registration Error:", err.message);
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, email, created_at FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Log the username to verify it
    console.log("Logged-in username:", user.rows[0].username);

    // Include the username in the response
    res.json({ token, userName: user.rows[0].username });
  } catch (err) {
    console.error("🔥 Login Error:", err.message);
    res.status(500).json({ error: "Failed to log in" });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email, password, oldPassword } = req.body;

  try {
    // Fetch the user from the database
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate the old password
    const isMatch = await bcrypt.compare(oldPassword, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user details
    const result = await pool.query(
      `UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4 RETURNING *`,
      [username, email, hashedPassword, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("🔥 Update User Error:", err.message);
    res.status(500).json({ error: "Failed to update user" });
  }
});

const createSalesRouter = require("./sales");
const salesRouter = createSalesRouter(pool);
app.use("/api/sales", salesRouter);

// Cash Flow API Routes (keep existing)
app.get('/api/cashflow', async (req, res) => {
  try {
    const { filterType, subcategory, customDate, startDate, endDate, month, year } = req.query;
    
    let query = 'SELECT * FROM cash_flow';
    const params = [];
    let paramCount = 0;

    if (filterType === 'single' && customDate) {
      query += ` WHERE date::date = $${++paramCount}`;
      params.push(customDate);
    }
    else if (filterType === 'range' && startDate && endDate) {
      query += ` WHERE date::date BETWEEN $${++paramCount} AND $${++paramCount}`;
      params.push(startDate, endDate);
    }
    else if (filterType === 'month' && month) {
      query += ` WHERE EXTRACT(MONTH FROM date) = $${++paramCount}`;
      params.push(month);
    }
    else if (filterType === 'year' && year) {
      query += ` WHERE EXTRACT(YEAR FROM date) = $${++paramCount}`;
      params.push(year);
    }

    if (subcategory) {
      if (paramCount === 0) {
        query += ` WHERE subcategory = $${++paramCount}`;
      } else {
        query += ` AND subcategory = $${++paramCount}`;
      }
      params.push(subcategory);
    }

    query += ' ORDER BY date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 Cash Flow GET Error:', err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

app.post('/api/cashflow', async (req, res) => {
  const { category, subcategory, amount, date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO cash_flow (category, subcategory, amount, date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [category, subcategory, amount, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('🔥 Cash Flow POST Error:', err);
    res.status(500).json({ error: 'Failed to save entry' });
  }
});

app.put('/api/cashflow/:id', async (req, res) => {
  const { id } = req.params;
  const { category, subcategory, amount, date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE cash_flow
       SET category = $1, subcategory = $2, amount = $3, date = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [category, subcategory, amount, date, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 Cash Flow PUT Error:', err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

app.delete('/api/cashflow/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM cash_flow WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('🔥 Cash Flow DELETE Error:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// Profit & Loss API Routes (new)
app.get('/api/profit-loss', async (req, res) => {
  try {
    const { month, type } = req.query; // Get both month and type from query
    let query = `
      SELECT 
        id,
        TO_CHAR(month, 'YYYY-MM') AS month,
        category,
        type,
        amount,
        created_at,
        updated_at
      FROM profit_loss
    `;
    const params = [];
    let paramCount = 0;

    // Add month filter if provided
    if (month) {
      query += ` WHERE TO_CHAR(month, 'YYYY-MM') = $${++paramCount}`;
      params.push(month);
    }

    // Add type filter if provided
    if (type) {
      if (paramCount === 0) {
        query += ` WHERE type = $${++paramCount}`;
      } else {
        query += ` AND type = $${++paramCount}`;
      }
      params.push(type);
    }

    query += ' ORDER BY month DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 Profit & Loss GET Error:', err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

app.post('/api/profit-loss', async (req, res) => {
  const { month, category, type, amount } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO profit_loss (month, category, type, amount)
       VALUES (TO_DATE($1, 'YYYY-MM'), $2, $3, $4)
       RETURNING *`,
      [month, category, type, amount]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('🔥 Profit & Loss POST Error:', err);
    res.status(500).json({ error: 'Failed to save entry' });
  }
});

app.put('/api/profit-loss/:id', async (req, res) => {
  const { id } = req.params;
  const { month, category, type, amount } = req.body;
  try {
    const result = await pool.query(
      `UPDATE profit_loss
       SET month = TO_DATE($1, 'YYYY-MM'),
           category = $2,
           type = $3,
           amount = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [month, category, type, amount, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 Profit & Loss PUT Error:', err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

app.delete('/api/profit-loss/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM profit_loss WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('🔥 Profit & Loss DELETE Error:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// Account Limit API Endpoints
app.get('/api/account-limit', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM account_settings WHERE key = $1',
      ['account_limit']
    );
    const limit = rows.length > 0 ? Number(rows[0].value) : 1000000;
    res.json({ limit });
  } catch (err) {
    console.error('Account limit fetch error:', err);
    res.status(500).json({ error: "Failed to fetch account limit" });
  }
});

app.put('/api/account-limit', async (req, res) => {
  const { limit } = req.body;
  try {
    // First check if the setting exists
    const { rows } = await pool.query(
      'SELECT * FROM account_settings WHERE key = $1',
      ['account_limit']
    );

    if (rows.length > 0) {
      // Update existing setting
      await pool.query(
        'UPDATE account_settings SET value = $1 WHERE key = $2',
        [limit.toString(), 'account_limit']
      );
    } else {
      // Insert new setting
      await pool.query(
        'INSERT INTO account_settings (key, value) VALUES ($1, $2)',
        ['account_limit', limit.toString()]
      );
    }

    res.json({ limit: Number(limit) });
  } catch (err) {
    console.error('Account limit update error:', err);
    res.status(500).json({ error: "Failed to update account limit" });
  }
});

// Keep all existing routes below exactly the same
app.get("/", (req, res) => {
  res.send("🚀 Backend is running!");
});

app.get("/api/product/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const query = 'SELECT * FROM products WHERE code = $1';
    const result = await pool.query(query, [code]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 PRODUCT LOOKUP ERROR:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM items");
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 GET ITEMS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

app.post("/api/items", async (req, res) => {
  const {
    code,
    hsn_code,
    company_name,
    category,
    sub_category,
    quantity,
    purchase_price,
    selling_price_mrp,
    gst_rate,
    rack_no,
  } = req.body;
  try {
    const checkQuery = `
      SELECT * FROM items
      WHERE company_name ILIKE $1 AND category ILIKE $2 AND sub_category ILIKE $3
    `;
    const existing = await pool.query(checkQuery, [
      company_name.trim(),
      category.trim(),
      sub_category.trim(),
    ]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "❌ Item already exists..." });
    }
    const insertQuery = `
      INSERT INTO items 
        (code, hsn_code, company_name, category, sub_category, quantity, purchase_price, selling_price_mrp, gst_rate,rack_no)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`;
    const result = await pool.query(insertQuery, [
      code,
      hsn_code,
      company_name,
      category,
      sub_category,
      quantity,
      purchase_price,
      selling_price_mrp,
      gst_rate,
      rack_no,
    ]);
    sendEventToClients('inventory', { action: 'add', item: result.rows[0] });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("🔥 INSERT ERROR:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  const {
    code,
    hsn_code,
    company_name,
    category,
    sub_category,
    quantity,
    purchase_price,
    selling_price_mrp,
    gst_rate,
    rack_no
  } = req.body;

  try {
    const updateQuery = `
      UPDATE items
      SET 
        code = $1,
        hsn_code = $2,
        company_name = $3,
        category = $4,
        sub_category = $5,
        quantity = $6,
        purchase_price = $7,
        selling_price_mrp = $8,
        gst_rate = $9,
        rack_no = $10
      WHERE id = $11
      RETURNING *`;

    const result = await pool.query(updateQuery, [
      code,
      hsn_code,
      company_name,
      category,
      sub_category,
      quantity,
      purchase_price,
      selling_price_mrp,
      Number(gst_rate),
      rack_no,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    // ✅ Only one response is sent
    return res.json(result.rows[0]); // Added return
    
  } catch (err) {
    console.error("🔥 UPDATE ERROR:", err.message);
    return res.status(500).json({ error: "Failed to update item" }); // Added return
  }
});

app.delete("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM items WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "✅ Item deleted successfully" });
  } catch (err) {
    console.error("🔥 DELETE ERROR:", err.message);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
});

const PORT = process.env.PORT || 5000;
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});
app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});