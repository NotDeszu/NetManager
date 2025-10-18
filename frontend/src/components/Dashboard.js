import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
    const [user, setUser] = useState({ email: 'admin@example.com' });

    useEffect(() => {
        // You can fetch user data here using the token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <div className="dashboard-page">
            <div className="header">
                <div className="logo">
                    <div className="logo-icon">📊</div>
                    <h1>NetManager</h1>
                </div>
                <div className="user-info">
                    <span>{user.email}</span>
                    <button className="filter-btn" onClick={handleLogout}>Logout</button>
                </div>
            </div>

            <div className="container">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Total Devices</span>
                            <div className="stat-icon">🖥️</div>
                        </div>
                        <div className="stat-value">24</div>
                        <div className="stat-change">↑ 2 new this week</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Online</span>
                            <div className="stat-icon">✓</div>
                        </div>
                        <div className="stat-value">22</div>
                        <div className="stat-change">91.7% uptime</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Alerts</span>
                            <div className="stat-icon">⚠️</div>
                        </div>
                        <div className="stat-value">3</div>
                        <div className="stat-change negative">↑ 1 since yesterday</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Avg. CPU Usage</span>
                            <div className="stat-icon">📈</div>
                        </div>
                        <div className="stat-value">34%</div>
                        <div className="stat-change">↓ 5% from last hour</div>
                    </div>
                </div>

                <div className="chart-section">
                    <div className="section-header">
                        <h2 className="section-title">Network Traffic Overview</h2>
                        <button className="filter-btn">Last 24 Hours</button>
                    </div>
                    <div className="chart-placeholder">
                        📊 Traffic chart visualization would go here
                    </div>
                </div>

                <div className="devices-section">
                    <div className="section-header">
                        <h2 className="section-title">Active Devices</h2>
                        <button className="filter-btn">View All</button>
                    </div>

                    <div className="devices-grid">
                        <DeviceCard 
                            name="Core Switch 01"
                            type="Cisco Catalyst 9300"
                            status="online"
                            cpu={23}
                            temperature={42}
                            memory="5.2 GB"
                            uptime="45 days"
                            interfaces={[
                                { name: 'eth0', speed: '1 Gbps ↑↓' },
                                { name: 'eth1', speed: '10 Gbps ↑↓' }
                            ]}
                        />

                        <DeviceCard 
                            name="Router 01"
                            type="Juniper MX204"
                            status="warning"
                            cpu={78}
                            temperature={68}
                            memory="12.8 GB"
                            uptime="12 days"
                            interfaces={[
                                { name: 'ge-0/0/0', speed: '10 Gbps ↑↓' },
                                { name: 'ge-0/0/1', speed: '10 Gbps ↑↓' }
                            ]}
                        />

                        <DeviceCard 
                            name="Firewall 01"
                            type="Fortinet FortiGate 600E"
                            status="online"
                            cpu={34}
                            temperature={48}
                            memory="8.4 GB"
                            uptime="89 days"
                            interfaces={[
                                { name: 'port1', speed: '1 Gbps ↑↓' },
                                { name: 'port2', speed: '1 Gbps ↑↓' }
                            ]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function DeviceCard({ name, type, status, cpu, temperature, memory, uptime, interfaces }) {
    return (
        <div className="device-card">
            <div className="device-header">
                <div className="device-info">
                    <h3>{name}</h3>
                    <p className="device-type">{type}</p>
                </div>
                <span className={`status-badge status-${status}`}>
                    {status === 'online' ? 'Online' : 'Warning'}
                </span>
            </div>
            
            <div className="metrics">
                <div className="metric">
                    <span className="metric-label">CPU Usage</span>
                    <span className="metric-value">{cpu}%</span>
                    <div className="progress-bar">
                        <div 
                            className={`progress-fill ${cpu > 70 ? 'high' : ''}`}
                            style={{ width: `${cpu}%` }}
                        ></div>
                    </div>
                </div>
                <div className="metric">
                    <span className="metric-label">Temperature</span>
                    <span className="metric-value">{temperature}°C</span>
                    <div className="progress-bar">
                        <div 
                            className={`progress-fill ${temperature > 60 ? 'high' : ''}`}
                            style={{ width: `${temperature}%` }}
                        ></div>
                    </div>
                </div>
                <div className="metric">
                    <span className="metric-label">Memory</span>
                    <span className="metric-value">{memory}</span>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill"
                            style={{ width: '65%' }}
                        ></div>
                    </div>
                </div>
                <div className="metric">
                    <span className="metric-label">Uptime</span>
                    <span className="metric-value">{uptime}</span>
                </div>
            </div>

            <div className="interfaces-list">
                {interfaces.map((iface, idx) => (
                    <div key={idx} className="interface-item">
                        <span className="interface-name">{iface.name}</span>
                        <span className="interface-speed">{iface.speed}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;