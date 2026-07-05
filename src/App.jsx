import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login'; 
import Dashboard from './Dashboard'; 
import Personel from './Personel';
import Muhasebe from './Muhasebe';
import Planlama from './Planlama';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Giriş Sayfası */}
                <Route path="/login" element={<Login />} />
                
                {/* Panel ve Modüller (Hepsi Korumalı) */}
                <Route 
                    path="/dashboard" 
                    element = {
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />

                <Route 
                    path="/personel" 
                    element = {
                        <ProtectedRoute>
                            <Personel />
                        </ProtectedRoute>
                    } 
                />

                <Route 
                    path="/muhasebe" 
                    element = {
                        <ProtectedRoute>
                            <Muhasebe />
                        </ProtectedRoute>
                    } 
                />

                <Route 
                    path="/planlama" 
                    element = {
                        <ProtectedRoute>
                            <Planlama />
                        </ProtectedRoute>
                    } 
                />

                {/* Yönlendirme Kuralları */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;