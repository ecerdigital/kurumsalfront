import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Muhasebe = () => {
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const dailyTotal = React.useMemo(() => {
    return entries.reduce((acc, entry) => {
        const val = parseFloat(entry.amount) || 0;
        return entry.entry_type === 'alacak' ? acc + val : acc - val;
    }, 0);
}, [entries]);
    const [formData, setFormData] = useState({ 
        amount: '', 
        entry_type: 'alacak', 
        description: '', 
        date: new Date().toISOString().split('T')[0] 
    });

    const deleteEntry = async (id) => {
    if (window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
        try {
            await axios.delete(`http://localhost:8000/api/finance/${id}/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            // Silme başarılıysa listeyi güncelle
            setEntries(entries.filter(e => e.id !== id));
        } catch (error) {
            console.error("Silme hatası:", error);
            alert("Silme işlemi başarısız oldu.");
        }
    }
};

    // 1. Verileri Çek
    const fetchEntries = (date = formData.date) => {
        axios.get(`http://localhost:8000/api/finance/?date=${date}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(res => setEntries(res.data))
        .catch(err => console.error("Veri çekilemedi:", err));
    };

    useEffect(() => { fetchEntries(); }, []);

    // 2. Yeni Kayıt Ekle
    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8000/api/finance/', formData, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(() => {
            fetchEntries();
            setFormData({...formData, amount: '', description: ''});
        });
    };

    // 3. Excel'e Aktar
    const exportToCSV = () => {
    // CSV başlıkları
    const headers = ["Tarih", "Tip", "Aciklama", "Tutar"];
    
    // Verileri CSV satırlarına dönüştür
    const csvContent = [
        headers.join(","),
        ...entries.map(e => [e.date, e.entry_type, e.description, e.amount].join(","))
    ].join("\n");

    // İndirme işlemini başlat
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Muhasebe_Raporu_${formData.date}.csv`;
    link.click();
};

    return (
        <div style={styles.container}>
            
            <h1>💰 Muhasebe & Maaş</h1>
            
            {/* Giriş Formu */}
            <div style={styles.card}>
                <input type="date" value={formData.date} onChange={(e) => {
                    setFormData({...formData, date: e.target.value});
                    fetchEntries(e.target.value);
                }} style={styles.input} />
                
                <input type="number" placeholder="Tutar" value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: e.target.value})} style={styles.input} />
                
                <select value={formData.entry_type} onChange={e => setFormData({...formData, entry_type: e.target.value})} style={styles.input}>
                    <option value="alacak">Alacak</option>
                    <option value="borc">Borç</option>
                </select>
                
                <input type="text" placeholder="Açıklama" value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} style={styles.input} />
                
                <button onClick={handleSubmit} style={styles.activeBtn}>Kaydet</button>
            </div>

            {/* Liste ve Excel */}
            <div style={styles.card}>
                <div style={styles.headerRow}>
                    <h3>Günlük Kayıtlar</h3>
                    <button onClick={exportToCSV} style={styles.excelBtn}>📊 Excel İndir</button>
                </div>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Tarih</th>
                            <th style={styles.th}>Tip</th>
                            <th style={styles.th}>Açıklama</th>
                            <th style={styles.th}>Tutar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(e => (
                            <tr key={e.id}>
                                <td style={styles.td}>{e.date}</td>
                                <td style={styles.td}>{e.entry_type}</td>
                                <td style={styles.td}>{e.description}</td>
                                <td style={styles.td}>{e.amount} TL</td>
                                <td style={styles.td}>
                                    <button 
                                        onClick={() => deleteEntry(e.id)}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#e53e3e'; // Üzerine gelince içini kırmızı yap
                                            e.target.style.color = '#fff';              // Yazıyı beyaz yap
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#fff';    // Gidince eski haline dön
                                            e.target.style.color = '#e53e3e';
                                        }}
                                        style={styles.deleteBtn}
                                    >
                                        Sil
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className='sum'>
                    <h3>Günlük Toplam: {dailyTotal} TL</h3>
                </div>
                <button 
                    style={styles.backBtn}
                    onClick={() => navigate('/dashboard')} 
                    style={styles.backBtn}
                >
                    ⬅ Dashboard'a Dön
                </button>
            </div>
            
        </div>
    );
};

const styles = {
    deleteBtn: {
        padding: '6px 12px',
        backgroundColor: '#fff',       // Başlangıçta beyaz (temiz durması için)
        color: '#e53e3e',             // Kırmızı yazı
        border: '1px solid #e53e3e',  // Kırmızı çerçeve
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
        transition: 'all 0.2s ease-in-out', // Yumuşak geçiş
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    backBtn: {
        padding: '10px 20px',
        backgroundColor: 'rgb(49, 130, 206)', // İstediğin beyaz renk
        color: 'white',          // Yazı rengi (koyu gri, okuması kolay olsun diye)
        border: '1px solid #cbd5e0', // Hafif bir çerçeve (beyaz üstünde kaybolmasın diye)
        borderRadius: '8px',
        cursor: 'pointer',
        marginBottom: '20px',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    container: { padding: '40px', maxWidth: '1000px', margin: '0 auto' },
    card: { padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' },
    input: { padding: '10px', margin: '5px', borderRadius: '6px', border: '1px solid #ccc' },
    activeBtn: { padding: '10px 20px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    excelBtn: { padding: '10px 20px', background: '#2f855a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    table: { 
        width: '100%', 
        borderCollapse: 'collapse', 
        marginTop: '10px',
        tableLayout: 'fixed' // Sütun genişliklerini sabitler, kaymayı önler
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        borderBottom: '2px solid #ddd',
        width: '20%' // Her sütuna eşit genişlik (4 sütun olduğu için %25)
    },
    td: {
        padding: '12px',
        borderBottom: '1px solid #eee',
        wordWrap: 'break-word' // Uzun açıklamaların kutudan taşmasını engeller
    }
};

export default Muhasebe;