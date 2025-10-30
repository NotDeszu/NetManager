import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './DeviceDetail.css';

function DeviceDetail() {
    const { id } = useParams(); 
    const [device, setDevice] = useState(null);
    const [error, setError] = useState('');
    const [timespan, setTimespan] = useState('day');
    const [events, setEvents] = useState([]);

    // Fetch device details
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

    // Fetch recent events (mock data - replace with actual API call)
    useEffect(() => {
        // Mock events data - replace with actual API call
        const mockEvents = [
            {
                id: 1,
                type: 'info',
                message: 'Device came online',
                timestamp: '2 minutes ago'
            },
            {
                id: 2,
                type: 'warning',
                message: 'High CPU usage detected (85%)',
                timestamp: '15 minutes ago'
            },
            {
                id: 3,
                type: 'success',
                message: 'Backup completed successfully',
                timestamp: '1 hour ago'
            },
            {
                id: 4,
                type: 'error',
                message: 'Connection timeout on port 8080',
                timestamp: '3 hours ago'
            }
        ];
        setEvents(mockEvents);
    }, [id]);

    // Get authenticated graph URL
    const getAuthenticatedGraphUrl = (graphType) => {
        const token = localStorage.getItem('token');
        if (!token) return '';
        
        return `${process.env.REACT_APP_API_BASE_URL}/devices/${id}/graphs/${graphType}?timespan=${timespan}&token=${token}`;
    };

    // Format uptime
    const formatUptime = (uptime) => {
        if (!uptime) return 'N/A';
        return uptime;
    };

    // Get timespan label
    const getTimespanLabel = (span) => {
        const labels = {
            day: '24h',
            week: '7d',
            month: '30d',
            year: '1y'
        };
        return labels[span] || span;
    };

    // Render loading state
    if (error) {
        return (
            <div className="device-detail-container">
                <div className="error-container">
                    <div className="error-message">⚠️ {error}</div>
                    <Link to="/dashboard" className="back-link">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (!device) {
        return (
            <div className="device-detail-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading device details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="device-detail-container">
            {/* Header */}
            <div className="device-header">
                <div>
                    <Link to="/dashboard" className="back-link">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="device-title">{device.hostname}</h1>
                    <p className="device-subtitle">Device ID: {id}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Status</span>
                        <span className="stat-icon">{device.status ? '✓' : '✗'}</span>
                    </div>
                    <div>
                        <span className={`status-badge ${device.status ? 'status-up' : 'status-down'}`}>
                            {device.status ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Uptime</span>
                        <span className="stat-icon">⏱️</span>
                    </div>
                    <div className="stat-value">{formatUptime(device.uptime_text)}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">IP Address</span>
                        <span className="stat-icon">🌐</span>
                    </div>
                    <div className="stat-value" style={{ fontSize: '1.25rem' }}>{device.ip}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Operating System</span>
                        <span className="stat-icon">💻</span>
                    </div>
                    <div className="stat-value" style={{ fontSize: '1rem' }}>{device.os}</div>
                </div>
            </div>

            <div className="content-grid">
                {/* Device Information */}
                <div className="section-card">
                    <div className="section-header">
                        <h2 className="section-title">Device Information</h2>
                    </div>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Hardware</span>
                            <span className="info-value">{device.hardware || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Serial Number</span>
                            <span className="info-value">{device.serial || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Operating System</span>
                            <span className="info-value">{device.os || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Location</span>
                            <span className="info-value">{device.location || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Performance Graphs */}
                <div className="section-card">
                    <div className="section-header">
                        <h2 className="section-title">Performance Metrics</h2>
                        <div className="timespan-selector">
                            <button 
                                className={`timespan-btn ${timespan === 'day' ? 'active' : ''}`}
                                onClick={() => setTimespan('day')}
                            >
                                24h
                            </button>
                            <button 
                                className={`timespan-btn ${timespan === 'week' ? 'active' : ''}`}
                                onClick={() => setTimespan('week')}
                            >
                                7d
                            </button>
                            <button 
                                className={`timespan-btn ${timespan === 'month' ? 'active' : ''}`}
                                onClick={() => setTimespan('month')}
                            >
                                30d
                            </button>
                            <button 
                                className={`timespan-btn ${timespan === 'year' ? 'active' : ''}`}
                                onClick={() => setTimespan('year')}
                            >
                                1y
                            </button>
                        </div>
                    </div>

                    <div className="graphs-grid">
                        {/* Network Traffic */}
                        <div className="graph-container">
                            <h3 className="graph-title">📊 Network Traffic (bits/sec)</h3>
                            <div className="graph-wrapper">
                                <img 
                                    key={`traffic-${timespan}`}
                                    src={getAuthenticatedGraphUrl('device_bits')}
                                    alt="Network traffic graph"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '<span class="graph-loading">Graph unavailable</span>';
                                    }}
                                />
                            </div>
                        </div>

                        {/* CPU Usage */}
                        <div className="graph-container">
                            <h3 className="graph-title">⚙️ CPU Usage (%)</h3>
                            <div className="graph-wrapper">
                                <img 
                                    key={`processor-${timespan}`}
                                    src={getAuthenticatedGraphUrl('health_processor')}
                                    alt="CPU usage graph"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '<span class="graph-loading">Graph unavailable</span>';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Memory Usage */}
                        <div className="graph-container">
                            <h3 className="graph-title">🧠 Memory Usage (%)</h3>
                            <div className="graph-wrapper">
                                <img 
                                    key={`mempool-${timespan}`}
                                    src={getAuthenticatedGraphUrl('health_mempool')}
                                    alt="Memory usage graph"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '<span class="graph-loading">Graph unavailable</span>';
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Events */}
                <div className="section-card">
                    <div className="section-header">
                        <h2 className="section-title">Recent Events</h2>
                    </div>
                    <div className="events-list">
                        {events.length > 0 ? (
                            events.map(event => (
                                <div key={event.id} className={`event-item ${event.type}`}>
                                    <div className="event-header">
                                        <span className="event-type">{event.type.toUpperCase()}</span>
                                        <span className="event-time">{event.timestamp}</span>
                                    </div>
                                    <div className="event-message">{event.message}</div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#94a3b8', textAlign: 'center' }}>No recent events</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeviceDetail;