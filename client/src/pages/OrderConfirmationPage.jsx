import { useLocation, useSearchParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, ArrowRight, Mail } from 'lucide-react';
import { Button, Badge, Card } from '../components/ui';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const OrderConfirmationPage = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { width, height } = useWindowSize();

  // Accepts order ID from: router state (COD/direct) OR query param (JazzCash redirect)
  const orderId = location.state?.orderId || searchParams.get('order_id');
  const viaJazzCash = searchParams.get('via') === 'jazzcash';

  if (!orderId) {
    return <Navigate to="/" />;
  }

  return (
    <div className="confirmation-page relative">
      <Confetti width={width} height={height} recycle={false} numberOfPieces={800} gravity={0.15} />
      <div className="container relative z-10 py-12">
        <Card 
          as={motion.div}
          className="max-w-3xl mx-auto p-12 text-center overflow-visible"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-emerald-200">
            <CheckCircle size={56} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Thank You for Your Order!</h1>
          <div className="flex flex-col items-center gap-3 mb-8">
            <Badge variant="info" className="px-6 py-2 text-base rounded-full shadow-sm">
              Order ID: <span className="font-black ml-1">{orderId}</span>
            </Badge>
            {viaJazzCash && (
              <Badge variant="success" className="flex items-center gap-2 px-4 py-1.5 rounded-full">
                <CheckCircle size={14} /> JazzCash Payment Verified
              </Badge>
            )}
          </div>
          
          <p className="text-slate-500 max-w-lg mx-auto leading-relaxed text-lg mb-12 font-medium">
            We've received your order and our team is already preparing it for you. A confirmation email has been sent to your inbox.
          </p>

          <div className="flex items-center justify-between max-w-md mx-auto mb-16 relative">
            <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 -z-10"></div>
            <div className="flex flex-col items-center gap-3 bg-white px-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                <CheckCircle size={20} />
              </div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Confirmed</span>
            </div>
            <div className="flex flex-col items-center gap-3 bg-white px-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                <Package size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Processing</span>
            </div>
            <div className="flex flex-col items-center gap-3 bg-white px-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                <Truck size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shipped</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="bg-slate-50 border-none p-6 text-left group hover:bg-slate-100 transition-colors">
              <Mail className="text-primary mb-4 transition-transform group-hover:scale-110" size={32} />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Check your email</h3>
              <p className="text-sm text-slate-500 m-0">We'll send you tracking updates as your order moves through our system.</p>
            </Card>
            <Card className="bg-slate-50 border-none p-6 text-left group hover:bg-slate-100 transition-colors">
              <Package className="text-primary mb-4 transition-transform group-hover:scale-110" size={32} />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Track your order</h3>
              <p className="text-sm text-slate-500 m-0">You can see real-time updates and history in your account dashboard.</p>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button as={Link} to="/shop" variant="primary" size="lg" className="h-14 px-8" icon={ArrowRight}>
              Continue Shopping
            </Button>
            <Button as={Link} to="/" variant="admin-outline" size="lg" className="h-14 px-8">
              Back to Home
            </Button>
          </div>
        </Card>
      </div>


    </div>
  );
};

export default OrderConfirmationPage;
