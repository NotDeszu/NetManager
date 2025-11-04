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

// --- Get All Devices for a Tenant (Improved and More Robust) ---
app.get('/api/devices', authMiddleware, async (req, res) => {
    const tenantId = req.user.tenantId;
    console.log(`[GET /api/devices] Fetching devices for tenantId: ${tenantId}`);

    const apiToken = process.env.LIBRENMS_API_TOKEN ? process.env.LIBRENMS_API_TOKEN.trim() : null;
    if (!apiToken) return res.status(500).json({ error: 'LibreNMS API token is not configured.' });

    const client = await pool.connect();
    try {
        // Step 1: Get the list of device IDs this tenant owns from OUR database.
        const ownedDevicesResult = await client.query(
            'SELECT librenms_device_id FROM tenant_devices WHERE tenant_id = $1',
            [tenantId]
        );
        const ownedDeviceIds = ownedDevicesResult.rows.map(row => row.librenms_device_id);
        console.log(`[GET /api/devices] Tenant owns device IDs:`, ownedDeviceIds);

        if (ownedDeviceIds.length === 0) {
            console.log(`[GET /api/devices] Tenant owns no devices. Returning empty array.`);
            return res.status(200).json([]); // Return an empty array if they own no devices
        }

        // Step 2: Fetch details for ONLY these specific devices from LibreNMS.
        // We will make one API call for each device. This is simpler and more reliable.
        const devicePromises = ownedDeviceIds.map(deviceId => {
            const libreNmsUrl = `http://librenms:8000/api/v0/devices/${deviceId}`;
            return axios.get(libreNmsUrl, { headers: { 'X-Auth-Token': apiToken } });
        });
        
        // Wait for all the API calls to complete.
        const responses = await Promise.all(devicePromises);

        // Extract the device data from each response.
        const tenantDevices = responses.map(response => response.data.devices[0]);
        console.log(`[GET /api/devices] Successfully fetched details for ${tenantDevices.length} devices.`);

        res.status(200).json(tenantDevices);

    } catch (error) {
        // More detailed error logging
        console.error('[GET /api/devices] An error occurred:', error.message);
        if (error.response) {
            console.error('[GET /api/devices] LibreNMS API Error:', error.response.data);
        }
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

// --- Get a Specific Graph for a Device (ROBUST IMAGE PROXY) ---
app.get('/api/devices/:id/:type', authMiddleware, async (req, res) => {
    const { id, type } = req.params;
    const tenantId = req.user.tenantId;
    const { timespan = 'day' } = req.query;
    const apiToken = process.env.LIBRENMS_API_TOKEN ? process.env.LIBRENMS_API_TOKEN.trim() : null;

    if (!apiToken) {
        return res.status(500).send('API token not configured on server.');
    }

    const client = await pool.connect();
    try {
        // SECURITY CHECK: Verify this tenant owns this device ID.
        const ownershipCheck = await client.query(
            'SELECT * FROM tenant_devices WHERE tenant_id = $1 AND librenms_device_id = $2',
            [tenantId, id]
        );

        if (ownershipCheck.rows.length === 0) {
            return res.status(404).send('Device not found or permission denied.');
        }

        // Map timespan to from/to (rrdtool-style strings; adjust mappings as needed)
        let from = 'now - 1 day'; // Default to 1 day
        let to = 'now';
        switch (timespan) {
            case 'hour':
                from = 'now - 1 hour';
                break;
            case 'week':
                from = 'now - 1 week';
                break;
            case 'month':
                from = 'now - 1 month';
                break;
            // Add more (e.g., 'year') if your frontend supports them
        }

        // Build the LibreNMS URL with proper params (no 'timespan')
        const libreNmsGraphUrl = `http://librenms:8000/api/v0/devices/${id}/${type}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
        console.log(`Proxying graph request for tenant ${tenantId} to: ${libreNmsGraphUrl}`);

        const response = await axios({
            method: 'get',
            url: libreNmsGraphUrl,
            responseType: 'stream',
            headers: { 'X-Auth-Token': apiToken }
        });

        // Set status and copy relevant headers before piping
        res.status(response.status);
        res.set('Content-Type', response.headers['content-type'] || 'image/png'); // Fallback to PNG
        if (response.headers['content-length']) {
            res.set('Content-Length', response.headers['content-length']);
        }
        // Optionally copy more headers if needed (e.g., Cache-Control)

        // Pipe the stream
        response.data.pipe(res);

        // Handle stream errors to prevent hangs
        response.data.on('error', (err) => {
            console.error(`Stream error for graph ${type}:`, err.message);
            if (!res.headersSent) {
                res.status(500).send('Error streaming graph image.');
            }
        });

    } catch (error) {
        console.error(`[Graph Proxy Error] for ${type}:`, error.message);
        if (error.response) {
            console.error(`[Graph Proxy] LibreNMS responded with status: ${error.response.status}`);
            res.status(error.response.status).send(error.response.statusText);
        } else {
            res.status(500).send('An internal error occurred while fetching the graph.');
        }
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