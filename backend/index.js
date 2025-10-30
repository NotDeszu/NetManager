require('dotenv').config()
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); 
const axios = require('axios');
const http = require('http');
const authMiddleware = require('./authMiddleware');

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
            process.env.JWT_SECRET, // In a real app, use an environment variable!
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
app.get('/api/test-librenms', authMiddleware, async (req, res) => {
    const libreNmsUrl = 'http://librenms:8000/api/v0/system';
    const apiToken = process.env.LIBRENMS_API_TOKEN ? process.env.LIBRENMS_API_TOKEN.trim() : null;
    if (!apiToken) return res.status(500).json({ error: 'LibreNMS API token is not configured.' });
    try {
        const response = await axios.get(libreNmsUrl, { headers: { 'X-Auth-Token': apiToken } });
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error contacting LibreNMS API:', error.message);
        res.status(500).json({ error: 'Failed to communicate with the LibreNMS service.', details: error.message });
    }
});
// --- Get All Devices for a Tenant ---
app.get('/api/devices', authMiddleware, async (req, res) => {
    const tenantId = req.user.tenantId;
    const libreNmsUrl = `http://librenms:8000/api/v0/devices`;
    const apiToken = process.env.LIBRENMS_API_TOKEN ? process.env.LIBRENMS_API_TOKEN.trim() : null;
    if (!apiToken) return res.status(500).json({ error: 'LibreNMS API token is not configured.' });
    const client = await pool.connect();
    try {
        const ownedDevicesResult = await client.query('SELECT librenms_device_id FROM tenant_devices WHERE tenant_id = $1', [tenantId]);
        const ownedDeviceIds = ownedDevicesResult.rows.map(row => row.librenms_device_id);
        if (ownedDeviceIds.length === 0) return res.status(200).json([]);
        const libreNmsResponse = await axios.get(libreNmsUrl, { headers: { 'X-Auth-Token': apiToken } });
        const allDevices = libreNmsResponse.data.devices;
        const tenantDevices = allDevices.filter(device => ownedDeviceIds.includes(device.device_id));
        res.status(200).json(tenantDevices);
    } catch (error) {
        console.error('Error fetching devices:', error.message);
        res.status(500).json({ error: 'Failed to fetch device data.' });
    } finally {
        client.release();
    }
});
// --- Get a Single Device's Details for a Tenant (SECURED) ---
app.get('/api/devices/:id', authMiddleware, async (req, res) => {
    const { id } = req.params; // Get the device ID from the URL parameter
    const tenantId = req.user.tenantId;

    const apiToken = process.env.LIBRENMS_API_TOKEN ? process.env.LIBRENMS_API_TOKEN.trim() : null;
    if (!apiToken) return res.status(500).json({ error: 'LibreNMS API token is not configured.' });

    const client = await pool.connect();
    try {
        // SECURITY CHECK: Verify this tenant owns this device ID.
        const ownershipCheck = await client.query(
            'SELECT * FROM tenant_devices WHERE tenant_id = $1 AND librenms_device_id = $2',
            [tenantId, id]
        );

        if (ownershipCheck.rows.length === 0) {
            // If no record is found, this user does not own this device.
            return res.status(404).json({ error: 'Device not found or you do not have permission to view it.' });
        }

        // If the check passes, fetch the details from LibreNMS.
        const libreNmsUrl = `http://librenms:8000/api/v0/devices/${id}`;
        const libreNmsResponse = await axios.get(libreNmsUrl, {
            headers: { 'X-Auth-Token': apiToken }
        });

        res.status(200).json(libreNmsResponse.data.devices[0]);

    } catch (error) {
        console.error(`Error fetching device ${id}:`, error.message);
        res.status(500).json({ error: 'Failed to fetch device details.' });
    } finally {
        client.release();
    }
});

// --- Get a Specific Graph for a Device (SECURED IMAGE PROXY) ---
app.get('/api/devices/:id/graphs/:type', authMiddleware, async (req, res) => {
    const { id, type } = req.params; // e.g., id=5, type='bits'
    const tenantId = req.user.tenantId;

    // We can get the timespan from a query parameter, defaulting to 'day'
    // This allows URLs like ?timespan=week
    const { timespan = 'day' } = req.query;

    const apiToken = process.env.LIBRENMS_API_TOKEN ? process.env.LIBRENMS_API_TOKEN.trim() : null;
    if (!apiToken) return res.status(500).json({ error: 'LibreNMS API token is not configured.' });

    const client = await pool.connect();
    try {
        // SECURITY CHECK: First, verify this tenant owns this device ID.
        const ownershipCheck = await client.query(
            'SELECT * FROM tenant_devices WHERE tenant_id = $1 AND librenms_device_id = $2',
            [tenantId, id]
        );
        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Device not found or you do not have permission.' });
        }

        // If the check passes, build the URL to the LibreNMS graph image.
        // Example graph types: 'bits' (for traffic), 'health_processor' (CPU), 'health_mempool' (Memory)
        const libreNmsGraphUrl = `http://librenms:8000/api/v0/devices/${id}/graphs/${type}?timespan=${timespan}`;
        
        console.log(`Proxying graph request for tenant ${tenantId} to: ${libreNmsGraphUrl}`);

        // We make the request with responseType: 'stream'. This is very efficient.
        // It tells axios not to load the whole image into memory, but to stream it.
        const response = await axios({
            method: 'get',
            url: libreNmsGraphUrl,
            responseType: 'stream',
            headers: { 'X-Auth-Token': apiToken }
        });

        // We "pipe" the image stream from LibreNMS directly to the client's response.
        // This turns our endpoint into a high-performance image proxy.
        response.data.pipe(res);

    } catch (error) {
        console.error(`Error proxying graph ${type} for device ${id}:`, error.message);
        res.status(500).json({ error: 'Failed to fetch graph.' });
    } finally {
        client.release();
    }
});
// --- Get the Event Log for a Device (SECURED) ---
app.get('/api/devices/:id/eventlog', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const apiToken = process.env.LIBRENMS_API_TOKEN ? process.env.LIBRENMS_API_TOKEN.trim() : null;
    if (!apiToken) return res.status(500).json({ error: 'LibreNMS API token is not configured.' });

    const client = await pool.connect();
    try {
        // SECURITY CHECK: Verify this tenant owns this device ID.
        const ownershipCheck = await client.query(
            'SELECT * FROM tenant_devices WHERE tenant_id = $1 AND librenms_device_id = $2',
            [tenantId, id]
        );
        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Device not found or you do not have permission.' });
        }

        // If check passes, fetch the event log from LibreNMS. We'll limit it to the last 20 events.
        const libreNmsUrl = `http://librenms:8000/api/v0/logs/eventlog/${id}?limit=20`;
        
        console.log(`Fetching event log for device ${id}`);
        const response = await axios.get(libreNmsUrl, {
            headers: { 'X-Auth-Token': apiToken }
        });

        res.status(200).json(response.data.eventlog);

    } catch (error) {
        console.error(`Error fetching event log for device ${id}:`, error.message);
        res.status(500).json({ error: 'Failed to fetch event log.' });
    } finally {
        client.release();
    }
});

// --- Add a New Device for a Tenant ---
app.post('/api/devices', authMiddleware, async (req, res) => {
    const tenantId = req.user.tenantId;
    const { hostname, snmp_community } = req.body;
    if (!hostname || !snmp_community) return res.status(400).json({ error: 'Hostname and SNMP community are required.' });
    const libreNmsUrl = `http://librenms:8000/api/v0/devices`;
    const apiToken = process.env.LIBRENMS_API_TOKEN ? process.env.LIBRENMS_API_TOKEN.trim() : null;
    if (!apiToken) return res.status(500).json({ error: 'LibreNMS API token is not configured.' });
    const deviceData = { hostname: hostname, community: snmp_community, version: 'v2c' };
    try {
        const libreNmsResponse = await axios.post(libreNmsUrl, deviceData, { headers: { 'X-Auth-Token': apiToken } });
        if (libreNmsResponse.data.status === 'ok') {
            const newDevice = libreNmsResponse.data.devices[0];
            const newDeviceId = newDevice.device_id;
            const client = await pool.connect();
            try {
                await client.query('INSERT INTO tenant_devices (tenant_id, librenms_device_id) VALUES ($1, $2)', [tenantId, newDeviceId]);
            } finally {
                client.release();
            }
            res.status(201).json({ message: 'Device added successfully!', device: newDevice });
        } else {
            res.status(400).json({ error: 'LibreNMS failed to add the device.', details: libreNmsResponse.data.message });
        }
    } catch (error) {
        console.error('Error adding device via LibreNMS API:', error.message);
        res.status(500).json({ error: 'Failed to communicate with the LibreNMS service.', details: error.response ? error.response.data : error.message });
    }
});

// --- Start Server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});