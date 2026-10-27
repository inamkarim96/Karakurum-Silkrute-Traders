import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import WhatsAppButton from '../components/WhatsAppButton';

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout flex flex-col min-h-screen">
      <Navbar />
      <CartDrawer />
      <main className="content flex-1 mt-20">
        {children}
      </main>
      <WhatsAppButton />
      <Footer />
    </div>
  );
};

export default MainLayout;
