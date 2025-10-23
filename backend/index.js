const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); 
const axios = require('axios');
const http = require('http');

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
    client = await pool.connect();
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

// --- LibreNMS API Test Endpoint ---
app.get('/api/test-librenms', async (req, res) => {
    const libreNmsUrl = 'http://librenms:8000/api/v0/system';
    const apiToken = process.env.LIBRENMS_API_TOKEN ? process.env.LIBRENMS_API_TOKEN.trim() : null;

    if (!apiToken) {
        return res.status(500).json({ error: 'LibreNMS API token is not configured.' });
    }

    try {
        const agent = new http.Agent({ keepAlive: false });
        console.log(`Attempting to contact LibreNMS at: ${libreNmsUrl}`);

        const response = await axios.get(libreNmsUrl, {
            headers: { 'X-Auth-Token': apiToken },
            httpAgent: agent
        });

        res.status(200).json(response.data);

    } catch (error) {
        console.error('Error contacting LibreNMS API:', error.message);
        res.status(500).json({ 
            error: 'Failed to communicate with the LibreNMS service.',
            details: error.message 
        });
    }
});

// --- Get All Devices for a Tenant ---
// TODO: This endpoint needs to be protected by JWT middleware
app.get('/api/devices', async (req, res) => {
    // For now, we are still hardcoding the tenant ID.
    // Soon, the JWT middleware will provide this for us from the user's token.
    const tenantId = 1;

    const libreNmsUrl = `http://librenms:8000/api/v0/devices`;
    const apiToken = process.env.LIBRENMS_API_TOKEN ? process.env.LIBRENMS_API_TOKEN.trim() : null;

    if (!apiToken) {
        return res.status(500).json({ error: 'LibreNMS API token is not configured.' });
    }

    const client = await pool.connect();
    try {
        // Step 1: Get the list of device IDs this tenant owns from OUR database.
        const ownedDevicesResult = await client.query(
            'SELECT librenms_device_id FROM tenant_devices WHERE tenant_id = $1',
            [tenantId]
        );
        const ownedDeviceIds = ownedDevicesResult.rows.map(row => row.librenms_device_id);

        if (ownedDeviceIds.length === 0) {
            return res.status(200).json([]); // Return an empty array if they own no devices
        }

        // Step 2: Get the details for ALL devices from the LibreNMS API.
        const libreNmsResponse = await axios.get(libreNmsUrl, {
            headers: { 'X-Auth-Token': apiToken }
        });
        const allDevices = libreNmsResponse.data.devices;

        // Step 3: Filter the full list from LibreNMS to only include the ones this tenant owns.
        const tenantDevices = allDevices.filter(device => ownedDeviceIds.includes(device.device_id));

        res.status(200).json(tenantDevices);

    } catch (error) {
        console.error('Error fetching devices:', error.message);
        res.status(500).json({ error: 'Failed to fetch device data.' });
    } finally {
        client.release();
    }
});

// --- Add a New Device for a Tenant ---
app.post('/api/devices', async (req, res) => {
    // In a real application, we would get the tenant_id from a validated JWT.
    // For now, we'll simulate it. This is a critical security step.
    const tenantId = 1; // HARDCODED FOR NOW - will come from JWT later.

    const { hostname, snmp_community } = req.body;

    if (!hostname || !snmp_community) {
        return res.status(400).json({ error: 'Hostname and SNMP community are required.' });
    }

    const libreNmsUrl = `http://librenms:8000/api/v0/devices`;
    const apiToken = process.env.LIBRENMS_API_TOKEN ? process.env.LIBRENMS_API_TOKEN.trim() : null;

    if (!apiToken) {
        return res.status(500).json({ error: 'LibreNMS API token is not configured.' });
    }

    const deviceData = {
        hostname: hostname,
        community: snmp_community,
        version: 'v2c'
    };

    try {
        console.log(`Adding device for tenant ${tenantId}: ${hostname}`);
        
        // Make the POST request to the LibreNMS API
        const libreNmsResponse = await axios.post(libreNmsUrl, deviceData, {
            headers: { 'X-Auth-Token': apiToken }
        });

        if (libreNmsResponse.data.status === 'ok') {
            const newDevice = libreNmsResponse.data.devices[0];
            const newDeviceId = newDevice.device_id;
            console.log(`LibreNMS successfully added device with ID: ${newDeviceId}`);
            
            // Link the new device to the tenant in our own database
            const client = await pool.connect();
            try {
                await client.query(
                    'INSERT INTO tenant_devices (tenant_id, librenms_device_id) VALUES ($1, $2)',
                    [tenantId, newDeviceId]
                );
                console.log(`Successfully linked device ${newDeviceId} to tenant ${tenantId} in saas_db.`);
            } finally {
                client.release();
            }

            res.status(201).json({ 
                message: 'Device added successfully!',
                device: newDevice
            });

        } else {
            res.status(400).json({ error: 'LibreNMS failed to add the device.', details: libreNmsResponse.data.message });
        }

    } catch (error) {
        console.error('Error adding device via LibreNMS API:', error.message);
        res.status(500).json({ 
            error: 'Failed to communicate with the LibreNMS service.',
            details: error.response ? error.response.data : error.message
        });
    }
});

// --- Start Server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});