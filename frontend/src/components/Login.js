import React, { useState } from 'react';
import axios from 'axios';

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [message, setMessage] = useState('');

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            // Use the environment variable to build the URL
            const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/login`;
            const res = await axios.post(apiUrl, formData);
            localStorage.setItem('token', res.data.token);
            setMessage(res.data.message);
            // window.location.href = '/dashboard';
        } catch (error) {
            setMessage(error.response.data.error);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={onSubmit}>
                <input type="email" name="email" placeholder="Email" onChange={onChange} required />
                <input type="password" name="password" placeholder="Password" onChange={onChange} required />
                <button type="submit">Login</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default Login;