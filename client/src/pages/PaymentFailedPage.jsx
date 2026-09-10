import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, ShoppingCart } from 'lucide-react';
import { Button, Badge, Card } from '../components/ui';


/**
 * PaymentFailedPage
 * Shown when the JazzCash portal redirects back with a failed/cancelled payment.
 * Route: /payment/failed
 * Query params: order_id, code (JazzCash response code), reason
 */
const PaymentFailedPage = () => {
  const [searchParams] = useSearchParams();
  const orderId  = searchParams.get('order_id');
  const code     = searchParams.get('code');
  const reason   = searchParams.get('reason');

  const errorLabel = (() => {
    if (reason === 'invalid_signature') return 'Security verification failed';
    if (reason === 'invalid_ref')       return 'Invalid order reference';
    if (code)                           return `JazzCash error code: ${code}`;
    return 'Payment was not completed';
  })();

  return (
    <div className="failed-page">
      <div className="container">
        <Card 
          as={motion.div}
          className="max-w-xl mx-auto p-12 text-center"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-red-100">
            <XCircle size={56} strokeWidth={1.5} />
          </div>

          <h1 className="text-3xl font-black text-slate-800 mb-4">Payment Failed</h1>

          <p className="text-slate-500 mb-8 leading-relaxed">
            We weren't able to process your payment. Your order has been saved and
            no money was deducted from your account.
          </p>

          <Badge variant="error" className="px-4 py-1.5 rounded-full text-xs font-bold mb-10">
            {errorLabel}
          </Badge>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {orderId ? (
              <Button
                as={Link}
                to="/checkout"
                variant="primary"
                size="lg"
                icon={RefreshCw}
                className="flex-1"
              >
                Try Again
              </Button>
            ) : null}

            <Button
              as={Link}
              to="/shop"
              variant="admin-outline"
              size="lg"
              icon={ShoppingCart}
              className="flex-1"
            >
              Back to Shop
            </Button>
          </div>

          {orderId && (
            <div className="mt-12 pt-6 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                Order reference: <span className="text-slate-800">{orderId}</span>
              </p>
            </div>
          )}
        </Card>
      </div>


    </div>
  );
};

export default PaymentFailedPage;
