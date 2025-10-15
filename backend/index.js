const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); 

// --- Middlewares ---
const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// --- Database Connection ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- API Endpoints ---

// 1. User Registration
app.post('/api/register', async (req, res) => {
  console.log('---'); // Separator for new requests
  console.log('Received a request to /api/register');
  const { organizationName, email, password } = req.body;
  console.log('Request body:', req.body);

  if (!organizationName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  let client; // Define client outside the try block

  try {
    console.log('Attempting to get a client from the database pool...');
    client = await pool.connect(); // This is the most likely place it's getting stuck
    console.log('Successfully connected to the database and got a client.');

    await client.query('BEGIN');
    console.log('Transaction started.');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    console.log('Password hashed.');

    const tenantResult = await client.query(
      'INSERT INTO tenants (organization_name) VALUES ($1) RETURNING id',
      [organizationName]
    );
    const tenantId = tenantResult.rows[0].id;
    console.log(`Tenant created with ID: ${tenantId}`);

    const userResult = await client.query(
      'INSERT INTO users (tenant_id, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email',
      [tenantId, email, passwordHash]
    );
    console.log(`User created for email: ${userResult.rows[0].email}`);

    await client.query('COMMIT');
    console.log('Transaction committed.');
    
    res.status(201).json({
      message: 'User registered successfully!',
      user: userResult.rows[0],
    });
    console.log('Response sent to client.');

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('--- AN ERROR OCCURRED ---');
    console.error('Registration Error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) {
      client.release();
      console.log('Database client released.');
    }
  }
});

// 2. User Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        
        // Create a JWT Token
        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenant_id, email: user.email },
            'YOUR_SUPER_SECRET_KEY', // In a real app, use an environment variable!
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful!',
            token: token
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- Start Server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});