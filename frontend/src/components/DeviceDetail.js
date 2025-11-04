import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function DeviceDetail() {
    const { id } = useParams(); 
    const [device, setDevice] = useState(null);
    const [error, setError] = useState('');
    const [timespan, setTimespan] = useState('day');

    // This useEffect for fetching the main device data is correct
    useEffect(() => {
        const fetchDeviceDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/devices/${id}`;
                
                const response = await axios.get(apiUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                setDevice(response.data);
            } catch (err) {
                setError(err.response ? err.response.data.error : 'Failed to fetch device details.');
            }
        };

        fetchDeviceDetails();
    }, [id]);

    // --- THIS IS THE CORRECTED HELPER FUNCTION ---
    // It constructs the full, authenticated URL for the <img> tag's src attribute
    const getAuthenticatedGraphUrl = (graphType) => {
        const token = localStorage.getItem('token');
        if (!token) return ''; // Return empty string if no token, preventing a bad request
        
        // This URL will now include the token as a query parameter
        return `${process.env.REACT_APP_API_BASE_URL}/devices/${id}/${graphType}?timespan=${timespan}&token=${token}`;
    };

    // --- Render Logic ---
    if (error) {
        return <div><p>Error: {error}</p><Link to="/dashboard">Back to Dashboard</Link></div>;
    }

    if (!device) {
        return <p>Loading device details...</p>;
    }

    return (
        <div>
            <p><Link to="/dashboard">{'<'} Back to Dashboard</Link></p>
            <h1>Device Details: {device.hostname}</h1>

            <div style={{ border: '1px solid black', padding: '1em' }}>
                <h3>Core Information</h3>
                <ul>
                    <li><strong>Status:</strong> {device.status ? 'Up' : 'Down'}</li>
                    <li><strong>IP Address:</strong> {device.ip}</li>
                    <li><strong>Operating System:</strong> {device.os}</li>
                    <li><strong>Uptime:</strong> {device.uptime_text || 'N/A'}</li>
                    <li><strong>Hardware:</strong> {device.hardware}</li>
                    <li><strong>Serial Number:</strong> {device.serial || 'N/A'}</li>
                </ul>
            </div>

            <hr />

            <div style={{ border: '1px solid black', padding: '1em', marginTop: '1em' }}>
                <h3>Performance Graphs</h3>


                <div style={{ marginTop: '1em' }}>
                    <h4>Network Traffic (bits/sec)</h4>
                    <img 
                        key={`traffic-${timespan}`} // Using a more generic key
                        src={getAuthenticatedGraphUrl('device_bits')} // <-- THE ONLY CHANGE IS HERE
                        alt="Network traffic graph" 
                        style={{ maxWidth: '100%' }}
                    />

                    <h4>System Up time</h4>
                    <img 
                        key={`uptime-${timespan}`}
                        src={getAuthenticatedGraphUrl('device_uptime')}
                        alt="System Uptime graph"
                        style={{ maxWidth: '100%' }}
                    />

                    <h4>Memory Usage (%)</h4>
                    <img 
                        key={`mempool-${timespan}`}
                        src={getAuthenticatedGraphUrl('device_mempool')}
                        alt="Memory health graph"
                        style={{ maxWidth: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}

export default DeviceDetail;