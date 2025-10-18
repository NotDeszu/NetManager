import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [message, setMessage] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/login`;
            const res = await axios.post(apiUrl, formData);
            localStorage.setItem('token', res.data.token);
            setMessage(res.data.message);
            window.location.href = '/dashboard';
        } catch (error) {
            setMessage(error.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="logo-container">
                    <div className="logo-icon">
                        <svg viewBox="0 0 24 24">
                            <rect x="3" y="5" width="18" height="5" rx="1"></rect>
                            <rect x="3" y="14" width="18" height="5" rx="1"></rect>
                        </svg>
                    </div>
                    <h1>NetManager</h1>
                    <p>Sign in to access your network dashboard</p>
                </div>

                <form onSubmit={onSubmit}>
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

                    <div className="form-footer">
                        <div className="remember-me">
                            <input 
                                type="checkbox" 
                                id="remember" 
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor="remember">Remember me</label>
                        </div>
                        <a href="#" className="forgot-password">Forgot password?</a>
                    </div>

                    <button type="submit" className="sign-in-btn">Sign In</button>
                </form>

                {message && (
                    <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;