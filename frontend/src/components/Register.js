import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Register.css';

function Register() {
    const [formData, setFormData] = useState({ organizationName: '', email: '', password: '' });
    const [message, setMessage] = useState('');

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/register`;
            const res = await axios.post(apiUrl, formData);
            setMessage(res.data.message);
            // Optionally redirect to login after successful registration
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } catch (error) {
            setMessage(error.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <div className="logo-container">
                    <div className="logo-icon">
                        <svg viewBox="0 0 24 24">
                            <rect x="3" y="5" width="18" height="5" rx="1"></rect>
                            <rect x="3" y="14" width="18" height="5" rx="1"></rect>
                        </svg>
                    </div>
                    <h1>NetManager</h1>
                    <p>Create your account to start monitoring</p>
                </div>

                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="organizationName">Organization Name</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            <input 
                                type="text" 
                                id="organizationName" 
                                name="organizationName" 
                                placeholder="Your Organization"
                                value={formData.organizationName}
                                onChange={onChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                placeholder="admin@example.com"
                                value={formData.email}
                                onChange={onChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={onChange}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="register-btn">Create Account</button>
                </form>

                {message && (
                    <div className={`message ${message.includes('success') || message.includes('registered') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}

                <div className="login-link">
                    <p>Already have an account? <Link to="/login">Sign in</Link></p>
                </div>
            </div>
        </div>
    );
}

export default Register;