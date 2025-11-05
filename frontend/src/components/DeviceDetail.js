import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function DeviceDetail() {
    const { id } = useParams(); 
    const [device, setDevice] = useState(null);
    const [eventLog, setEventLog] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [timespan, setTimespan] = useState('day');

    useEffect(() => {
        const fetchAllDeviceData = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                setError("No authentication token found.");
                setIsLoading(false);
                return;
            }

            try {
                const headers = { 'Authorization': `Bearer ${token}` };
                const deviceApiUrl = `${process.env.REACT_APP_API_BASE_URL}/devices/${id}`;
                const eventLogApiUrl = `${process.env.REACT_APP_API_BASE_URL}/devices/${id}/eventlog`;

                // Use Promise.all to fetch both data points concurrently
                const [deviceResponse, eventLogResponse] = await Promise.all([
                    axios.get(deviceApiUrl, { headers }),
                    axios.get(eventLogApiUrl, { headers })
                ]);

                // Explicitly set the state from the responses
                setDevice(deviceResponse.data);
                setEventLog(eventLogResponse.data);

            } catch (err) {
                setError(err.response ? err.response.data.error : 'Failed to fetch device data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllDeviceData();
    }, [id]);

    const getAuthenticatedGraphUrl = (graphType) => {
        const token = localStorage.getItem('token');
        if (!token) return '';
        return `${process.env.REACT_APP_API_BASE_URL}/devices/${id}/${graphType}?timespan=${timespan}&token=${token}`;
    };

    if (isLoading) {
        return <p>Loading device details...</p>;
    }

    if (error) {
        return <div><p>Error: {error}</p><Link to="/dashboard">Back to Dashboard</Link></div>;
    }

    // Add a check to ensure device is not null before rendering
    if (!device) {
        return <p>Device details could not be loaded.</p>;
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
                <div>
                    <label htmlFor="timespan">Time Range: </label>
                    <select id="timespan" value={timespan} onChange={e => setTimespan(e.target.value)}>
                        <option value="day">Last 24 Hours</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last Year</option>
                    </select>
                </div>

                <div style={{ marginTop: '1em' }}>
                    <h4>Network Traffic (bits/sec)</h4>
                    <img key={`bits-${timespan}`} src={getAuthenticatedGraphUrl('device_bits')} alt="Network traffic graph" style={{ maxWidth: '100%' }} />
                    <h4>System Uptime</h4>
                    <img key={`uptime-${timespan}`} src={getAuthenticatedGraphUrl('device_uptime')} alt="System Uptime graph" style={{ maxWidth: '100%' }} />
                    <h4>Memory Usage</h4>
                    <img key={`mempool-${timespan}`} src={getAuthenticatedGraphUrl('device_mempool')} alt="Memory health graph" style={{ maxWidth: '100%' }} />
                </div>
            </div>

            <hr />

            <div style={{ border: '1px solid black', padding: '1em', marginTop: '1em' }}>
                <h3>Recent Events</h3>
                {eventLog.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Timestamp</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eventLog.map((logEntry, index) => (
                                <tr key={index}>
                                    <td style={{ border: '1px solid #ddd', padding: '8px', whiteSpace: 'nowrap' }}>
                                        {new Date(logEntry.datetime).toLocaleString()}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {logEntry.message}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No event log entries found for this device.</p>
                )}
            </div>
        </div>
    );
}

export default DeviceDetail;