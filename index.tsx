
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Gagal melakukan rendering aplikasi:", error);
    container.innerHTML = `<div style="padding: 20px; text-align: center; font-family: sans-serif;">
      <h2>Terjadi kesalahan saat memuat aplikasi.</h2>
      <p>Silakan coba refresh halaman atau hubungi pengembang.</p>
    </div>`;
  }
} else {
  console.error("Elemen root tidak ditemukan di DOM.");
}
