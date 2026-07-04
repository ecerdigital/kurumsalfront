import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        axios.post('http://localhost:8000/api/token/', {
            username: email,
            password: password
        })
        .then(response => {
            localStorage.setItem('token', response.data.access);
            console.log("🔓 Giriş başarılı, token kaydedildi.");
            // Sayfayı kökten yenileyerek yönlendiriyoruz ki Dashboard taze tokenla açılıp 401 vermesin
            window.location.href = '/dashboard';
        })
        .catch(err => {
            console.error(err);
            setError('E-posta veya şifre hatalı!');
        });
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleLogin} style={styles.card}>
                <h2>Şirket Paneli Girişi</h2>
                {error && <div style={styles.error}>{error}</div>}
                <input 
                    type="email" 
                    placeholder="E-posta Adresiniz" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    style={styles.input}
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Şifreniz" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    style={styles.input}
                    required 
                />
                <button type="submit" style={styles.button}>Giriş Yap</button>
            </form>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f7fb', fontFamily: 'Arial' },
    card: { padding: '40px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' },
    input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' },
    button: { width: '100%', padding: '12px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    error: { padding: '10px', backgroundColor: '#fed7d7', color: '#9b2c2c', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }
};

export default Login;