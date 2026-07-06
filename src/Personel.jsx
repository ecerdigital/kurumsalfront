import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Personel = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userPermissions, setUserPermissions] = useState([]);

    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', position: '', role_id: ''
    });
    const [displaySalary, setDisplaySalary] = useState('');
    const [displayPhone, setDisplayPhone] = useState('');
    
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState('');
    
    // Rol atama modalı
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedRoleId, setSelectedRoleId] = useState('');

    const sirketDepartmanlari = [
        { id: 'muhasebe', label: 'Muhasebe' },
        { id: 'muhasebe_muduru', label: 'Muhasebe Müdürü' },
        { id: 'planlama', label: 'Planlama' },
        { id: 'yonetici', label: 'Şirket Yöneticisi' }
    ];

    const formatPhoneInput = (value) => {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length === 0) return '';
        if (numbers.length <= 1) return '0';
        if (numbers.length <= 4) return `0 (${numbers.slice(1, 4)}`;
        if (numbers.length <= 7) return `0 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}`;
        if (numbers.length <= 9) return `0 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)} ${numbers.slice(7, 9)}`;
        return `0 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9, 11)}`;
    };

    const formatSalaryInput = (value) => {
        if (!value) return '';
        let valStr = value.toString();
        if (valStr.includes('.')) {
            valStr = valStr.split('.')[0];
        }
        const cleanNumber = valStr.replace(/[^\d]/g, '');
        return cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    // 🔐 Kullanıcının izinlerini getir
    const fetchUserPermissions = () => {
        axios.get('http://localhost:8000/api/personel/my-permissions/', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            setUserPermissions(res.data.permissions || []);
        })
        .catch(err => {
            console.error('İzin bilgileri alınamadı:', err);
            setUserPermissions([]);
        });
    };

    // Personel listesini getir
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
            console.error('Personel listesi alınamadı:', err);
            setLoading(false);
        });
    };

    // Rolleri getir
    const fetchRoles = () => {
        axios.get('http://localhost:8000/api/roles/', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            let data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            setRoles(data);
        })
        .catch(err => {
            console.error('Roller alınamadı:', err);
        });
    };

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchUserPermissions();
        fetchEmployees();
        fetchRoles();
    }, [token]);

    // İzin kontrolü
    const hasPermission = (permission) => {
        return userPermissions.includes(permission);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setFormError('');

        if (!hasPermission('personel_ekle')) {
            setFormError('Personel ekleme izniniz yok.');
            return;
        }

        if (!formData.position) {
            setFormError('Lütfen personelin şirket içindeki pozisyonunu/bölümünü seçin.');
            return;
        }

        const rawSalary = parseInt(displaySalary.toString().replace(/\./g, ''), 10) || 0;
        const rawPhone = displayPhone ? displayPhone.replace(/[^\d]/g, '') : '';

        const payload = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            position: formData.position,
            phone: rawPhone || null,
            salary: rawSalary,
            role_id: formData.role_id || null
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
            position: emp.position || '',
            role_id: emp.role_info?.id || ''
        });
        setDisplaySalary(emp.salary ? formatSalaryInput(emp.salary.toString()) : '');
        setDisplayPhone(emp.phone ? formatPhoneInput(emp.phone.toString()) : '');
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({ first_name: '', last_name: '', email: '', position: '', role_id: '' });
        setDisplaySalary('');
        setDisplayPhone('');
        setEditingId(null);
        setShowForm(false);
        setFormError('');
    };

    const handleDelete = (id) => {
        if (!hasPermission('personel_sil')) {
            alert('Personel silme izniniz yok.');
            return;
        }
        
        if (window.confirm("Bu personeli silmek istediğinize emin misiniz?")) {
            axios.delete(`http://localhost:8000/api/personel/${id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(() => setEmployees(employees.filter(emp => emp.id !== id)))
            .catch(() => alert("Silme başarısız."));
        }
    };

    // 👤 Rol atama
    const handleOpenRoleModal = (emp) => {
        setSelectedEmployee(emp);
        setSelectedRoleId(emp.role_info?.id || '');
        setShowRoleModal(true);
    };

    const handleAssignRole = () => {
        if (!selectedEmployee || !selectedRoleId) {
            alert('Lütfen bir rol seçin.');
            return;
        }

        axios.post(
            `http://localhost:8000/api/personel/${selectedEmployee.id}/assign-role/`,
            { role_id: selectedRoleId },
            { headers: { 'Authorization': `Bearer ${token}` } }
        )
        .then(res => {
            alert('Rol başarıyla atanmıştır.');
            fetchEmployees();
            setShowRoleModal(false);
        })
        .catch(err => {
            alert('Rol ataması başarısız: ' + (err.response?.data?.error || err.message));
        });
    };

    if (loading) return <div style={styles.centerText}>🔄 Personel listesi yükleniyor...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <button onClick={() => navigate('/dashboard')} style={styles.miniBackButton}>← Panele Dön</button>
                    <h1 style={styles.title}>👥 Personel Yönetimi</h1>
                </div>
                {hasPermission('personel_ekle') && (
                    <button onClick={() => { if(showForm) resetForm(); else setShowForm(true); }} style={showForm ? styles.cancelBtn : styles.addBtn}>
                        {showForm ? '❌ Formu Kapat' : '➕ Yeni Personel Ekle'}
                    </button>
                )}
            </div>

            {/* 📝 Personel Ekleme Formu */}
            {showForm && hasPermission('personel_ekle') && (
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
                        <select 
                            value={formData.role_id} 
                            onChange={e => setFormData({...formData, role_id: e.target.value})} 
                            style={styles.input}
                        >
                            <option value="">-- Rol Seçin (İsteğe Bağlı) --</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
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

            {/* 👥 Personel Tablosu */}
            {hasPermission('personel_goruntule') ? (
                <div style={styles.tableResponsive}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Ad Soyad</th>
                                <th style={styles.th}>E-Posta</th>
                                <th style={styles.th}>Telefon</th>
                                <th style={styles.th}>Pozisyon</th>
                                <th style={styles.th}>Rol</th>
                                <th style={styles.th}>Maaş</th>
                                <th style={styles.th}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length === 0 ? (
                                <tr><td colSpan="7" style={styles.noData}>Şirketinize ait personel bulunamadı.</td></tr>
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
                                            <span style={{...styles.badge, backgroundColor: emp.role_info ? '#c6f6d5' : '#fed7d7'}}>
                                                {emp.role_info?.name || 'Rol Atanmamış'}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {emp.salary ? `${formatSalaryInput(emp.salary.toString())} ₺` : '0 ₺'}
                                        </td>
                                        <td style={styles.td}>
                                            <button onClick={() => handleOpenRoleModal(emp)} style={styles.roleBtn} title="Rol Ata">👤 Rol Ata</button>
                                            {hasPermission('personel_ekle') && (
                                                <button onClick={() => handleEditClick(emp)} style={styles.editBtn}>✏️ Düzenle</button>
                                            )}
                                            {hasPermission('personel_sil') && (
                                                <button onClick={() => handleDelete(emp.id)} style={styles.deleteBtn}>🗑️ Sil</button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={styles.noPermission}>🔒 Personel listesini görüntüleme izniniz yok.</div>
            )}

            {/* 👤 Rol Atama Modalı */}
            {showRoleModal && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h3>👤 {selectedEmployee?.first_name} {selectedEmployee?.last_name} için Rol Ata</h3>
                        <select 
                            value={selectedRoleId} 
                            onChange={e => setSelectedRoleId(e.target.value)} 
                            style={styles.input}
                        >
                            <option value="">-- Bir Rol Seçin --</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                        <div style={styles.modalActions}>
                            <button onClick={handleAssignRole} style={styles.saveBtn}>✓ Onayla</button>
                            <button onClick={() => setShowRoleModal(false)} style={styles.cancelBtn}>✕ İptal</button>
                        </div>
                    </div>
                </div>
            )}
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
    noPermission: { padding: '30px', backgroundColor: '#fed7d7', color: '#9b2c2c', borderRadius: '6px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' },
    roleBtn: { padding: '6px 12px', backgroundColor: '#bee3f8', color: '#2c5282', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold', fontSize: '13px' },
    editBtn: { padding: '6px 12px', backgroundColor: '#feebc8', color: '#c05621', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold', fontSize: '13px' },
    deleteBtn: { padding: '6px 12px', backgroundColor: '#fed7d7', color: '#9b2c2c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
    centerText: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', fontFamily: 'Arial' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', minWidth: '400px' },
    modalActions: { display: 'flex', gap: '10px', marginTop: '20px' }
};

export default Personel;
