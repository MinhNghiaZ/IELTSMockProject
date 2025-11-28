import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Routes from './Routes.tsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import 'swiper/swiper-bundle.css';
import { AuthProvider } from './contexts/AuthContext.tsx';
import 'bootstrap-icons/font/bootstrap-icons.css';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  //   <Routes />
  //   <ToastContainer position="top-right" autoClose={3000} />
  // </StrictMode>,

  <StrictMode>
      <AuthProvider>
        <Routes />
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
  </StrictMode>,
)
