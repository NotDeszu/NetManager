import React, { useState } from 'react';
import axios from 'axios';

function Register() {
    const [formData, setFormData] = useState({ organizationName: '', email: '', password: '' });
    const [message, setMessage] = useState('');

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault(); 
        try {
            // Use the environment variable to build the URL
            const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/register`;
            const res = await axios.post(apiUrl, formData);
            setMessage(res.data.message);
        } catch (error) {
            setMessage(error.response.data.error);
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={onSubmit}>
                <input type="text" name="organizationName" placeholder="Organization Name" onChange={onChange} required />
                <input type="email" name="email" placeholder="Email" onChange={onChange} required />
                <input type="password" name="password" placeholder="Password" onChange={onChange} required />
                <button type="submit">Register</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default Register;