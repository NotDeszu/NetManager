import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Dashboard.css';

function Dashboard() {
    const [devices, setDevices] = useState([]);
    const [newDevice, setNewDevice] = useState({ hostname: '', snmp_community: 'public' });
    const [message, setMessage] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // State for the current user's email
    const navigate = useNavigate();

    const fetchDevices = async () => {
        try {
            const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/devices`;
            const data = await authenticatedFetch(apiUrl); 
            setDevices(data);
        } catch (error) {
            console.error('Error fetching devices:', error);
            setMessage('Failed to fetch devices.');
        }
    };

    useEffect(() => {
        // Decode the JWT to get the user's email when the component loads
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setCurrentUser(decodedToken.email); // The 'email' field we put in the payload
            } catch (error) {
                console.error("Failed to decode JWT:", error);
                // Handle invalid token by logging out
                handleLogout();
            }
        } else {
            // If there's no token, redirect to login
            navigate('/login');
        }

        fetchDevices();
        const interval = setInterval(fetchDevices, 30000); // Auto-refresh every 30 seconds
        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [navigate]); // Add navigate to dependency array to satisfy ESLint

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewDevice(prevState => ({ ...prevState, [name]: value }));
    };

    const handleAddDevice = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/devices`;
            const data = await authenticatedFetch(apiUrl, {
                method: 'POST',
                body: JSON.stringify(newDevice)
            });
            
            setMessage(data.message);
            setNewDevice({ hostname: '', snmp_community: 'public' });
            setShowAddForm(false);
            fetchDevices(); // Refresh the device list immediately

        } catch (error) {
            console.error('Error adding device:', error);
            setMessage(error.message);
        }
    };
    
    const stats = {
        total: devices.length,
        online: devices.filter(d => d.status === true).length,
        offline: devices.filter(d => d.status === false).length
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="dashboard-page">
            <div className="header">
                <div className="logo">
                    <div className="logo-icon">📊</div>
                    <h1 className="logo-text">NetManager</h1>
                </div>
                <div className="user-info">
                    {/* Display the current user's email */}
                    {currentUser && <span className="current-user">Welcome, {currentUser}</span>}
                    <button 
                        onClick={handleLogout} 
                        className="logout-button"
                    >
                        Log Out
                    </button>
                    <button 
                        className="add-button"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        {showAddForm ? '✕ Cancel' : '+ Add Device'}
                    </button>
                </div>
            </div>

            <div className="container">
                {message && (
                    <div className={`message ${message.includes('Failed') || message.includes('error') ? 'message-error' : 'message-success'}`}>
                        {message}
                    </div>
                )}

                {showAddForm && (
                    <div className="add-form-card">
                        <h2 className="form-title">Add New Device</h2>
                        <form className="form" onSubmit={handleAddDevice}>
                            <div className="form-group">
                                <label className="label">Hostname</label>
                                <input
                                    type="text"
                                    name="hostname"
                                    value={newDevice.hostname}
                                    onChange={handleInputChange}
                                    placeholder="e.g., router-01.network.local"
                                    className="input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">SNMP Community</label>
                                <input
                                    type="text"
                                    name="snmp_community"
                                    value={newDevice.snmp_community}
                                    onChange={handleInputChange}
                                    className="input"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="submit-button"
                            >
                                Add Device
                            </button>
                        </form>
                    </div>
                )}

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Total Devices</span>
                            <div className="stat-icon">🖥️</div>
                        </div>
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-change">Monitored devices</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Online</span>
                            <div className="stat-icon">✓</div>
                        </div>
                        <div className="stat-value">{stats.online}</div>
                        <div className="stat-change">
                            {stats.total > 0 ? `${Math.round((stats.online / stats.total) * 100)}% uptime` : '0% uptime'}
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Offline</span>
                            <div className="stat-icon stat-icon-offline">⚠️</div>
                        </div>
                        <div className="stat-value">{stats.offline}</div>
                        <div className={`stat-change ${stats.offline > 0 ? 'stat-change-offline' : 'stat-change-online'}`}>
                            {stats.offline > 0 ? 'Needs attention' : 'All systems operational'}
                        </div>
                    </div>
                </div>

                <div className="devices-section">
                    <div className="section-header">
                        <h2 className="section-title">Monitored Devices</h2>
                        <span className="refresh-info">Auto-refresh: 30s</span>
                    </div>

                    {devices.length > 0 ? (
                        <div className="devices-grid">
                            {devices.map(device => (
                                // Make the entire card a clickable link
                                <Link to={`/device/${device.device_id}`} key={device.device_id} className="device-card-link">
                                    <DeviceCard device={device} />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📡</div>
                            <p className="empty-text">No devices are currently being monitored.</p>
                            <p className="empty-subtext">Click "Add Device" to start monitoring your network.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// NOTE: The DeviceCard component is kept as a separate component within the same file.
// This is a common pattern for small, self-contained components.
function DeviceCard({ device }) {
    const isOnline = device.status === true;
    
    return (
        <div className={`device-card`}>
            <div className="device-header">
                <div className="device-info">
                    <h3 className="device-name">{device.hostname}</h3>
                    <p className="device-type">{device.os || 'Unknown OS'}</p>
                </div>
                <span className={`status-badge ${isOnline ? 'status-badge-online' : 'status-badge-offline'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            </div>
            
            <div className="device-details">
                <div className="detail-row">
                    <span className="detail-label">IP Address</span>
                    <span className="detail-value">{device.ip || 'N/A'}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Device ID</span>
                    <span className="detail-value">{device.device_id}</span>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;