import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Önce terminalde şunu çalıştırın: npm install jwt-decode
import { jwtDecode } from 'jwt-decode'; 

const Dashboard = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [companyName, setCompanyName] = useState('Şirket'); // Varsayılan değer

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // Token'ı çözüyoruz
            const decoded = jwtDecode(token);
            
            // Django'da JWT payload'una şirket adını ne isimle gönderdiyseniz onu yakalayın
            // Genelde 'tenant_name', 'company_name' veya 'tenant' olur. 
            // Eğer doğrudan user bilgisi geliyorsa 'decoded.user?.tenant' şeklinde de olabilir.
            const sirketAdi = decoded.tenant_name || decoded.company || decoded.tenant || 'Şirket';
            
            setCompanyName(sirketAdi);
        } catch (error) {
            console.error("Token çözümlenirken hata oluştu:", error);
            // Token bozuksa güvenli çıkış yaptırabiliriz
            // handleLogout(); 
        }
    }, [token, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    {/* Şirket adı artık tamamen dinamik! */}
                    <h1>🏢 {companyName} Yönetim Paneli</h1>
                    <p>Tüm modüller aktif.</p>
                </div>
                <button onClick={handleLogout} style={styles.logoutBtn}>Çıkış Yap</button>
            </div>

            <div style={styles.grid}>
                {/* 👥 Personel Modülü */}
                <div style={styles.card}>
                    <h3>👥 Personel Yönetimi</h3>
                    <p>Çalışan listesi, izinler ve departman ayarları.</p>
                    <button onClick={() => navigate('/personel')} style={styles.activeBtn}>Yönetime Git →</button>
                </div>

                {/* 💰 Muhasebe Modülü */}
                <div style={styles.card}>
                    <h3>💰 Muhasebe & Maaş</h3>
                    <p>Maaş bordroları, harcemeler ve finansal raporlar.</p>
                    <button onClick={() => navigate('/muhasebe')} style={styles.activeBtn}>Finansa Git →</button>
                </div>

                {/* 📅 Planlama Modülü */}
                <div style={styles.card}>
                    <h3>📅 Planlama ve Görevler</h3>
                    <p>Şirket görevleri ve departman planlamaları.</p>
                    <button onClick={() => navigate('/planlama')} style={styles.activeBtn}>Planlamaya Git →</button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' },
    logoutBtn: { padding: '10px 20px', backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
    card: { padding: '24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
    activeBtn: { width: '100%', padding: '12px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px' },
};

export default Dashboard;