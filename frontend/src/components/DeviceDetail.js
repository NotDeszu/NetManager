import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './DeviceDetail.css';

function DeviceDetail() {
    const { id } = useParams(); 
    const [device, setDevice] = useState(null);
    const [eventLog, setEventLog] = useState([]);
    const [ports, setPorts] = useState([]);
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
                const portsApiUrl = `${process.env.REACT_APP_API_BASE_URL}/devices/${id}/ports`;

                const [deviceResponse, eventLogResponse, portsResponse] = await Promise.all([
                    axios.get(deviceApiUrl, { headers }),
                    axios.get(eventLogApiUrl, { headers }),
                    axios.get(portsApiUrl, { headers })
                ]);

                setDevice(deviceResponse.data);
                setEventLog(eventLogResponse.data);
                setPorts(portsResponse.data);

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
        return (
            <div className="device-detail-container">
                <div className="loading-container">
                    <p>Loading device details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="device-detail-container">
                <div className="error-container">
                    <p>Error: {error}</p>
                    <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    if (!device) {
        return (
            <div className="device-detail-container">
                <div className="loading-container">
                    <p>Device details could not be loaded.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="device-detail-container">
            <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
            
            <div className="page-header">
                <h1 className="page-title">Device Details: {device.hostname}</h1>
            </div>

            <div className="content-grid">
                {/* Core Information */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-icon">📊</div>
                        <h3 className="card-title">Core Information</h3>
                    </div>
                    <ul className="info-list">
                        <li className="info-item">
                            <span className="info-label">Status:</span>
                            <span className={`status-badge ${device.status ? 'status-up' : 'status-down'}`}>
                                {device.status ? 'Up' : 'Down'}
                            </span>
                        </li>
                        <li className="info-item">
                            <span className="info-label">IP Address:</span>
                            <span className="info-value">{device.ip}</span>
                        </li>
                        <li className="info-item">
                            <span className="info-label">Operating System:</span>
                            <span className="info-value">{device.os}</span>
                        </li>
                        <li className="info-item">
                            <span className="info-label">Hardware:</span>
                            <span className="info-value">{device.hardware}</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Device Ports */}
            <div className="card full-width-card">
                <div className="card-header">
                    <div className="card-icon">🔌</div>
                    <h3 className="card-title">Device Ports</h3>
                </div>
                {ports.length > 0 ? (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Port Name</th>
                                    <th>Description</th>
                                    <th>Speed (Mbps)</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ports.map((port, index) => (
                                    <tr key={index}>
                                        <td>{port.ifName}</td>
                                        <td>{port.ifDescr}</td>
                                        <td>{port.ifSpeed / 1000000 || 'N/A'}</td>
                                        <td>
                                            <span className={`port-status ${port.ifOperStatus === 'up' ? 'up' : 'down'}`}>
                                                {port.ifOperStatus.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="empty-state">No ports found for this device.</p>
                )}
            </div>

            {/* Performance Graphs */}
            <div className="card full-width-card">
                <div className="card-header">
                    <div className="card-icon">📈</div>
                    <h3 className="card-title">Performance Graphs</h3>
                </div>
                
                <div className="controls-section">
                    <label htmlFor="timespan" className="control-label">Time Range:</label>
                    <select 
                        id="timespan" 
                        className="control-select"
                        value={timespan} 
                        onChange={e => setTimespan(e.target.value)}
                    >
                        <option value="day">Last 24 Hours</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last Year</option>
                    </select>
                </div>

                <div className="graphs-grid">
                    <div className="graph-item">
                        <h4 className="graph-title">Network Traffic (bits/sec)</h4>
                        <img 
                            key={`bits-${timespan}`}
                            src={getAuthenticatedGraphUrl('device_bits')} 
                            alt="Network traffic graph" 
                            className="graph-image"
                        />
                    </div>
                    
                    <div className="graph-item">
                        <h4 className="graph-title">System Uptime</h4>
                        <img 
                            key={`uptime-${timespan}`}
                            src={getAuthenticatedGraphUrl('device_uptime')} 
                            alt="System Uptime graph" 
                            className="graph-image"
                        />
                    </div>
                    
                    <div className="graph-item">
                        <h4 className="graph-title">Memory Usage</h4>
                        <img 
                            key={`mempool-${timespan}`}
                            src={getAuthenticatedGraphUrl('device_mempool')} 
                            alt="Memory health graph" 
                            className="graph-image"
                        />
                    </div>
                </div>
            </div>

            {/* Recent Events */}
            <div className="card full-width-card">
                <div className="card-header">
                    <div className="card-icon">📋</div>
                    <h3 className="card-title">Recent Events</h3>
                </div>
                {eventLog.length > 0 ? (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Type</th>
                                    <th>Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {eventLog.map((logEntry, index) => (
                                    <tr key={index}>
                                        <td className="event-timestamp">
                                            {new Date(logEntry.datetime).toLocaleString()}
                                        </td>
                                        <td className="event-message">
                                            {logEntry.type}
                                        </td>
                                        <td className="event-message">
                                            {logEntry.message}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="empty-state">No event log entries found for this device.</p>
                )}
            </div>
        </div>
    );
}

export default DeviceDetail;