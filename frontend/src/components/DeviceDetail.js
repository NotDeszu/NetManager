import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function DeviceDetail() {
    // The useParams hook gets the ':id' from the URL
    const { id } = useParams(); 
    const [device, setDevice] = useState(null);
    const [error, setError] = useState('');

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
    }, [id]); // The effect re-runs if the 'id' parameter changes

    // --- Render Logic ---
    if (error) {
        return <div><p>Error: {error}</p><Link to="/dashboard">Back to Dashboard</Link></div>;
    }

    if (!device) {
        return <p>Loading device details...</p>;
    }

    return (
        <div>
            {/* Link to go back to the main dashboard */}
            <p><Link to="/dashboard">{'<'} Back to Dashboard</Link></p>
            
            <h1>Device Details: {device.hostname}</h1>

            <div style={{ border: '1px solid black', padding: '1em' }}>
                <h3>Core Information</h3>
                <ul>
                    <li><strong>Status:</strong> {device.status ? 'Up' : 'Down'}</li>
                    <li><strong>IP Address:</strong> {device.ip}</li>
                    <li><strong>Operating System:</strong> {device.os}</li>
                    <li><strong>Uptime:</strong> {device.uptime_text}</li>
                    <li><strong>Hardware:</strong> {device.hardware}</li>
                    <li><strong>Serial Number:</strong> {device.serial || 'N/A'}</li>
                </ul>
            </div>
        </div>
    );
}

export default DeviceDetail;