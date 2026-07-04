import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Personel = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(true);

    const sirketDepartmanlari = [
    { id: 'muhasebe', label: 'Muhasebe' },
    { id: 'muhasebe_muduru', label: 'Muhasebe Müdürü' },
    { id: 'planlama', label: 'Planlama' },
    { id: 'yonetici', label: 'Şirket Yöneticisi' }
];

    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', position: ''
    });
    const [displaySalary, setDisplaySalary] = useState('');
    const [displayPhone, setDisplayPhone] = useState('');
    
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState('');

    const formatPhoneInput = (value) => {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length === 0) return '';
        if (numbers.length <= 1) return '0';
        if (numbers.length <= 4) return `0 (${numbers.slice(1, 4)}`;
        if (numbers.length <= 7) return `0 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}`;
        if (numbers.length <= 9) return `0 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)} ${numbers.slice(7, 9)}`;
        return `0 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9, 11)}`;
    };

    // 💰 MAAŞ MASKESİ: Virgülden sonrasını tamamen yok sayar
    const formatSalaryInput = (value) => {
        if (!value) return '';
        
        // 1. Gelen değerin string olup olmadığını kontrol et
        let valStr = value.toString();
        
        // 2. Eğer içinde nokta varsa, noktadan sonrasını tamamen kes (ondalık kısımları at)
        if (valStr.includes('.')) {
            valStr = valStr.split('.')[0];
        }
        
        // 3. Artık elimizde sadece tam sayı kısmı var, bunu temizle ve formatla
        const cleanNumber = valStr.replace(/[^\d]/g, '');
        return cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const fetchEmployees = () => {
        axios.get('http://localhost:8000/api/personel/', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            let data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            setEmployees(data);
            setLoading(false);
        })
        .catch(err => {
            if (err.response && err.response.status === 403) setHasAccess(false);
            setLoading(false);
        });
    };

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchEmployees();
    }, [token]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setFormError('');

        if (!formData.position) {
            setFormError('Lütfen personelin şirket içindeki pozisyonunu/bölümünü seçin.');
            return;
        }

        // 🚨 BURAYI GÜNCELLEYİN: Noktaları kesin olarak temizle ve tam sayıya çevir
        const rawSalary = parseInt(displaySalary.toString().replace(/\./g, ''), 10) || 0;
        const rawPhone = displayPhone ? displayPhone.replace(/[^\d]/g, '') : '';

        const payload = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            position: formData.position,
            phone: rawPhone || null,
            salary: rawSalary // Artık gönderilen değer 50000 şeklinde, noktasız
        };

        const headers = { 'Authorization': `Bearer ${token}` };

        if (editingId) {
            axios.put(`http://localhost:8000/api/personel/${editingId}/`, payload, { headers })
                .then(() => { fetchEmployees(); resetForm(); })
                .catch(err => setFormError('Güncelleme sırasında bir hata oluştu.'));
        } else {
            axios.post('http://localhost:8000/api/personel/', payload, { headers })
                .then(() => { fetchEmployees(); resetForm(); })
                .catch(err => {
                    // Hatanın ne olduğunu görmek için konsola yazdır
                    console.log("Backend Hata Detayı:", err.response?.data);
                    setFormError(err.response?.data?.email ? 'Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var!' : 'Ekleme hatası: Bilgileri kontrol edin.');
                });
        }
    };

    const handleEditClick = (emp) => {
        setEditingId(emp.id);
        setFormData({
            first_name: emp.first_name,
            last_name: emp.last_name,
            email: emp.email,
            position: emp.position || ''
        });
        setDisplaySalary(emp.salary ? formatSalaryInput(emp.salary.toString()) : '');
        setDisplayPhone(emp.phone ? formatPhoneInput(emp.phone.toString()) : '');
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({ first_name: '', last_name: '', email: '', position: '' });
        setDisplaySalary('');
        setDisplayPhone('');
        setEditingId(null);
        setShowForm(false);
        setFormError('');
    };

    const handleDelete = (id) => {
        if (window.confirm("Bu personeli silmek istediğinize emin misiniz?")) {
            axios.delete(`http://localhost:8000/api/personel/${id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(() => setEmployees(employees.filter(emp => emp.id !== id)))
            .catch(() => alert("Silme başarısız."));
        }
    };

    if (loading) return <div style={styles.centerText}>🔄 Personel listesi yükleniyor...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <button onClick={() => navigate('/dashboard')} style={styles.miniBackButton}>← Panele Dön</button>
                    <h1 style={styles.title}>👥 Personel Yönetimi</h1>
                </div>
                <button onClick={() => { if(showForm) resetForm(); else setShowForm(true); }} style={showForm ? styles.cancelBtn : styles.addBtn}>
                    {showForm ? '❌ Formu Kapat' : '➕ Yeni Personel Ekle'}
                </button>
            </div>
            {showForm && (
                <form onSubmit={handleFormSubmit} style={styles.formCard}>
                    <h3>{editingId ? '📝 Personel Düzenle' : '✨ Yeni Personel Tanımla'}</h3>
                    {formError && <div style={styles.errorAlert}>{formError}</div>}
                    <div style={styles.formGrid}>
                        <input type="text" placeholder="Adı" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} style={styles.input} required />
                        <input type="text" placeholder="Soyadı" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} style={styles.input} required />
                        <input type="email" placeholder="E-Posta" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={styles.input} required disabled={!!editingId} />
                        <input type="text" placeholder="0 (532) 123 45 67" value={displayPhone} onChange={e => setDisplayPhone(formatPhoneInput(e.target.value))} style={styles.input} />
                        <select 
                            value={formData.position} 
                            onChange={e => setFormData({...formData, position: e.target.value})} 
                            style={styles.input} 
                            required
                        >
                            <option value="">-- Pozisyon / Bölüm Seçin --</option>
                            {sirketDepartmanlari.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.label}</option>
                            ))}
                        </select>
                        <input 
                            type="text" 
                            placeholder="Maaş (Örn: 50.000)" 
                            value={displaySalary} 
                            onChange={e => {
                                const cleanDigits = e.target.value.replace(/[^\d]/g, '');
                                setDisplaySalary(cleanDigits.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
                            }} 
                            style={styles.input} 
                        />
                    </div>
                    <div style={styles.formActions}>
                        <button type="submit" style={styles.saveBtn}>{editingId ? 'Değişiklikleri Kaydet' : 'Personel Ekle'}</button>
                        <button type="button" onClick={resetForm} style={styles.clearBtn}>İptal</button>
                    </div>
                </form>
            )}
            <div style={styles.tableResponsive}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Ad Soyad</th>
                            <th style={styles.th}>E-Posta</th>
                            <th style={styles.th}>Telefon</th>
                            <th style={styles.th}>Pozisyon / Bölüm</th>
                            <th style={styles.th}>Maaş</th>
                            <th style={styles.th}>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr><td colSpan="6" style={styles.noData}>Şirketinize ait personel bulunamadı.</td></tr>
                        ) : (
                            employees.map((emp) => (
                                <tr key={emp.id} style={styles.tr}>
                                    <td style={styles.td}><strong>{emp.first_name} {emp.last_name}</strong></td>
                                    <td style={styles.td}>{emp.email}</td>
                                    <td style={styles.td}>{emp.phone ? formatPhoneInput(emp.phone.toString()) : '—'}</td>
                                    <td style={styles.td}>
                                        <span style={styles.badge}>
                                            {sirketDepartmanlari.find(d => d.id === emp.position)?.label || emp.position || 'Belirtilmemiş'}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        {emp.salary ? `${formatSalaryInput(emp.salary.toString())} ₺` : '0 ₺'}
                                    </td>
                                    <td style={styles.td}>
                                        <button onClick={() => handleEditClick(emp)} style={styles.editBtn}>✏️ Düzenle</button>
                                        <button onClick={() => handleDelete(emp.id)} style={styles.deleteBtn}>🗑️ Sil</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
const styles = {
    container: { padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    title: { fontSize: '28px', color: '#1a202c', marginTop: '10px' },
    miniBackButton: { backgroundColor: 'transparent', border: 'none', color: '#3182ce', cursor: 'pointer', fontWeight: 'bold', padding: 0 },
    addBtn: { padding: '10px 20px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    cancelBtn: { padding: '10px 20px', backgroundColor: '#718096', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    formCard: { padding: '25px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' },
    input: { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px', backgroundColor: '#fff' },
    formActions: { display: 'flex', gap: '10px' },
    saveBtn: { padding: '10px 20px', backgroundColor: '#48bb78', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    clearBtn: { padding: '10px 20px', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    errorAlert: { padding: '10px', backgroundColor: '#fed7d7', color: '#9b2c2c', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' },
    tableResponsive: { width: '100%', overflowX: 'auto', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef2f5' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '16px', backgroundColor: '#f8fafc', color: '#4a5568', borderBottom: '2px solid #e2e8f0', fontSize: '14px', fontWeight: 'bold' },
    tr: { borderBottom: '1px solid #edf2f7' },
    td: { padding: '16px', color: '#2d3748', verticalAlign: 'middle', fontSize: '15px' },
    badge: { padding: '4px 8px', backgroundColor: '#e2e8f0', borderRadius: '4px', fontSize: '13px', color: '#4a5568', fontWeight: '500' },
    noData: { textAlign: 'center', padding: '30px', color: '#a0aec0' },
    editBtn: { padding: '6px 12px', backgroundColor: '#feebc8', color: '#c05621', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold' },
    deleteBtn: { padding: '6px 12px', backgroundColor: '#fed7d7', color: '#9b2c2c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    centerText: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', fontFamily: 'Arial' }
};
export default Personel;