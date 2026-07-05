import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/';

export default function Planlama() {
  const navigate = useNavigate();

  // 1. State Yönetimi
  const [gorevler, setGorevler] = useState([]);
  const [personeller, setPersoneller] = useState([]); 
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);

  // Form State
  const [yeniGorev, setYeniGorev] = useState({
    baslik: '',
    aciklama: '',
    baslangic_tarihi: '',
    bitis_tarihi: '',
    atanan_personel: ''
  });

  // 2. Axios Instance ve Dinamik Token interceptor Tanımı
  const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
  });

  api.interceptors.request.use((config) => {
    // Sayfa yenilense bile her istek anında en güncel token'ı tarayıcı hafızasından zorla okur
    const dinamikToken = localStorage.getItem('token');
    if (dinamikToken) {
      config.headers.Authorization = `Bearer ${dinamikToken}`;
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });

  // 3. Verileri Arka Arkaya (Sıralı) Çeken Güvenli Fonksiyon
  const verileriYenile = useCallback(async () => {
  try {
    // Sonlarına mutlaka '/' ekleyin
    const gorevRes = await api.get('gorevler/'); 
    setGorevler(gorevRes.data);

    const personelRes = await api.get('personel/');
    setPersoneller(personelRes.data);
    
    setHata(null);
  } catch (err) {
    console.error("Hatanın Tam Detayı:", err.response);
    
    // Hatanın ne olduğunu ekranda kabak gibi görmek için mesajı genişletiyoruz:
    setHata(`Sunucu Hatası (${err.response?.status || 'Bağlantı Yok'}): ${JSON.stringify(err.response?.data || err.message)}`);
  }
}, [navigate]);

  // 4. İlk Sayfa Yüklendiğinde Çalışacak Tetikleyici
  useEffect(() => {
    const aktifToken = localStorage.getItem('token');
    if (!aktifToken) {
      navigate('/login');
      return;
    }

    async function sayfaHazirla() {
      setYukleniyor(true);
      await verileriYenile();
      setYukleniyor(false);
    }

    sayfaHazirla();
  }, [navigate, verileriYenile]);

  // 5. Form Input Değişim Takibi
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setYeniGorev(prev => ({ ...prev, [name]: value }));
  };

  // 6. Yeni Görev Oluşturma Formu
  const handleGorevOlustur = async (e) => {
    e.preventDefault();
    
    if (!yeniGorev.atanan_personel) {
      alert("Lütfen görevin atanacağı personeli seçiniz.");
      return;
    }

    try {
      const gonderilecekVeri = {
        baslik: yeniGorev.baslik,
        aciklama: yeniGorev.aciklama,
        baslangic_tarihi: yeniGorev.baslangic_tarihi,
        bitis_tarihi: yeniGorev.bitis_tarihi,
        atanan_personel: parseInt(yeniGorev.atanan_personel, 10)
      };

      // Backend'e kaydet
      await api.post('gorevler/', gonderilecekVeri);
      
      // Kayıt başarılı olunca local state push yapmıyoruz; 
      // Doğrudan backend veritabanını sorgulayıp listeyi güncelliyoruz. Böylece sayfa yenilense de gitmez!
      await verileriYenile();
      
      // Formu sıfırla
      setYeniGorev({ baslik: '', aciklama: '', baslangic_tarihi: '', bitis_tarihi: '', atanan_personel: '' });
      alert('Görev başarıyla oluşturuldu ve veritabanına kaydedildi!');
    } catch (err) {
      console.error("Görev oluşturma hatası:", err.response?.data);
      alert("Görev backend'e kaydedilirken bir senkronizasyon hatası oluştu.");
    }
  };

  // 7. Görev Durumunu Güncelleme (Tamamlama)
  const handleGorevTamamla = async (id) => {
  // Kullanıcıya kazara basma ihtimaline karşı minik bir onay kutusu gösterelim
    if (!window.confirm("Bu görevi tamamladıysanız veritabanından kalıcı olarak silinecektir. Onaylıyor musunuz?")) {
      return;
    }

    try {
      // Doğrudan ilgili görevin id'sine DELETE isteği göndererek veritabanından siliyoruz
      await api.delete(`gorevler/${id}/`);
      
      // Silme işlemi başarılı olunca listeyi veritabanından tekrar çekip ekranı anında güncelliyoruz
      await verileriYenile();
      alert('Görev başarıyla tamamlandı ve veritabanından kalıcı olarak silindi!');
    } catch (err) {
      console.error("Görev silinirken hata oluştu:", err.response?.data || err.message);
      alert('Görev silinirken bir hata oluştu. Backend silme iznini kontrol edin.');
    }
  };

  if (yukleniyor) return <div style={styles.merkezText}>Şirket verileri yükleniyor...</div>;
  if (hata) return <div style={{...styles.merkezText, color: '#e53e3e', padding: '0 20px'}}>{hata}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <button onClick={() => navigate('/dashboard')} style={styles.geriBtn}>← Panele Geri Dön</button>
          <h1 style={styles.anaBaslik}>📅 Ortak Planlama Paneli</h1>
          <p style={{color: '#718096', margin: '5px 0 0 0'}}>Sadece şirketinizin personellerini ve görevlerini görürsünüz.</p>
        </div>
      </div>

      {/* GÖREV PLANLAMA FORMU */}
      <div style={styles.formCard}>
        <h2 style={styles.kartBaslik}>+ Yeni Görev Tanımla</h2>
        <form onSubmit={handleGorevOlustur} style={styles.formLayout}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Görev Başlığı:</label>
            <input type="text" name="baslik" value={yeniGorev.baslik} onChange={handleInputChange} required style={styles.input} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Açıklama / Detaylar:</label>
            <textarea name="aciklama" value={yeniGorev.aciklama} onChange={handleInputChange} rows="3" style={styles.textarea}></textarea>
          </div>
          <div>
            <label style={styles.label}>Başlangıç Tarihi:</label>
            <input type="date" name="baslangic_tarihi" value={yeniGorev.baslangic_tarihi} onChange={handleInputChange} required style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>Bitiş Tarihi:</label>
            <input type="date" name="bitis_tarihi" value={yeniGorev.bitis_tarihi} onChange={handleInputChange} required style={styles.input} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Görevin Atanacağı Şirket Personeli:</label>
            <select name="atanan_personel" value={yeniGorev.atanan_personel} onChange={handleInputChange} required style={styles.select}>
              <option value="">Şirketinizden bir personel seçin...</option>
              {personeller.map(p => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>
          <button type="submit" style={styles.kaydetBtn}>Görevi Ata ve Paylaş</button>
        </form>
      </div>

      {/* ŞİRKET GÖREV LİSTESİ */}
      <h2 style={styles.listeBaslik}>📋 Şirket Görevleri Havuzu</h2>
      <div style={styles.grid}>
        {gorevler.length === 0 ? (
          <p style={styles.bosText}>Şirketinize ait henüz bir görev bulunmuyor.</p>
        ) : (
          // Planlama.jsx içindeki listeleme (gorevler.map) kısmını bu şekilde güncelleyebilirsin:

        gorevler.map((gorev) => {
          // Hem küçük hem büyük harf ihtimaline karşı güvenli kontrol
          const isTamamlandi = gorev.durum?.toLowerCase() === 'tamamlandi'; 

          return (
            <div key={gorev.id} style={{
              ...styles.gorevKart,
              backgroundColor: isTamamlandi ? '#f0fff4' : '#fff', // Tamamlanınca tatlı bir yeşil olur
              borderColor: isTamamlandi ? '#c6f6d5' : '#e2e8f0',
              opacity: isTamamlandi ? 0.8 : 1 // Tamamlananlar biraz daha soft görünür
            }}>
              <div style={styles.kartHeader}>
                <h3 style={styles.gorevBaslik}>{gorev.baslik}</h3>
                <span style={{
                  ...styles.badge,
                  backgroundColor: isTamamlandi ? '#38a169' : '#dd6b20'
                }}>
                  {isTamamlandi ? 'TAMAMLANDI' : 'BEKLİYOR'}
                </span>
              </div>
              <p style={styles.gorevAciklama}>{gorev.aciklama || 'Açıklama girilmemiş.'}</p>
              <div style={styles.detaySatir}><strong>Atanan Kişi:</strong> {gorev.atanan_personel_ad || 'Yükleniyor...'}</div>
              <div style={styles.detaySatir}><strong>Tarih Aralığı:</strong> {gorev.baslangic_tarihi} / {gorev.bitis_tarihi}</div>
              
              {/* Eğer görev tamamlanmadıysa butonu göster, tamamlandıysa buton kaybolsun */}
              {!isTamamlandi && (
                <button onClick={() => handleGorevTamamla(gorev.id)} style={styles.tamamlaBtn}>
                  ✔ Görevi Tamamlandı Yap
                </button>
              )}
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}

// Orijinal Görsel Tasarımınızı ve Stillerinizi Aynen Korudum
const styles = {
  container: { padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial' },
  header: { borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px' },
  geriBtn: { padding: '6px 12px', backgroundColor: '#718096', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px' },
  anaBaslik: { margin: 0, color: '#2d3748' },
  formCard: { padding: '24px', backgroundColor: '#f7fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '40px' },
  kartBaslik: { marginTop: 0, marginBottom: '20px', color: '#2b6cb0' },
  formLayout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#4a5568', fontSize: '14px' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontFamily: 'Arial' },
  select: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', backgroundColor: '#fff' },
  kaydetBtn: { gridColumn: 'span 2', padding: '12px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  listeBaslik: { color: '#2d3748', marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' },
  gorevKart: { padding: '20px', borderRadius: '10px', border: '1px solid', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' },
  kartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  gorevBaslik: { margin: 0, fontSize: '18px', color: '#2d3748' },
  badge: { padding: '4px 8px', color: '#fff', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  gorevAciklama: { color: '#718096', fontSize: '14px', marginBottom: '15px', flexGrow: 1 },
  detaySatir: { fontSize: '13px', color: '#4a5568', marginBottom: '6px' },
  tamamlaBtn: { width: '100%', padding: '10px', backgroundColor: '#38a169', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px' },
  merkezText: { padding: '50px', textAlign: 'center', fontSize: '18px', fontFamily: 'Arial' },
  bosText: { color: '#718096', fontStyle: 'italic' }
};