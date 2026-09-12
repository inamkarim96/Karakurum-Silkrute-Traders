import React, { useState } from 'react';
import { CreditCard, CheckCircle, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge, Input, Card } from '../components/ui';

import { useCartStore } from '../store/useCartStore';
import { useAuth } from '../context/AuthContext';
import * as ordersApi from '../api/orders';
import { getMyAddresses } from '../api/users';

const CheckoutPage = () => {
  const [step, setStep] = useState(1);
  const cart = useCartStore((state) => state.cart);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const subtotal = getSubtotal();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const shipping = subtotal >= 2000 ? 0 : 150;
  const total = subtotal + shipping - discount;

  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    address: '',
    city: '',
    country: 'Pakistan',
    zipCode: '',
    paymentMethod: 'cod',
  });

  React.useEffect(() => {
    if (user) {
      getMyAddresses().then(res => {
        if (res.success && res.data && res.data.length > 0) {
          const defaultAddr = res.data.find(a => a.is_default) || res.data[0];
          setFormData(prev => ({
            ...prev,
            address: prev.address || defaultAddr.address_line || '',
            city: prev.city || defaultAddr.city || '',
            country: prev.country || defaultAddr.country || 'Pakistan',
            zipCode: prev.zipCode || defaultAddr.postal_code || ''
          }));
        }
      }).catch(err => console.error("Failed to fetch address:", err));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const errors = {};
    if (!formData.email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
    if (!formData.firstName) errors.firstName = 'First name is required';
    if (!formData.lastName) errors.lastName = 'Last name is required';
    if (!formData.address) errors.address = 'Address is required';
    if (!formData.city) errors.city = 'City is required';
    if (!formData.zipCode) errors.zipCode = 'ZIP Code is required';

    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      setStep(2);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      setPromoLoading(true);
      setPromoMsg(null);
      const { validateCoupon } = await import('../api/coupons');
      const res = await validateCoupon(promoCode.trim(), subtotal);
      if (res.success && res.data) {
        setDiscount(res.data.discount_amount || 0);
        setPromoMsg({ type: 'success', text: `Coupon applied! Saved PKR ${res.data.discount_amount.toLocaleString()}` });
      } else {
        setPromoMsg({ type: 'error', text: 'Invalid coupon code.' });
      }
    } catch (err) {
      setPromoMsg({ type: 'error', text: err.response?.data?.error?.message || 'Invalid coupon code.' });
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Map frontend method name to backend gateway enum
      const gatewayMap = { card: 'stripe', jazzcash: 'jazzcash', cod: 'cod' };
      const gateway = gatewayMap[formData.paymentMethod] || 'cod';

      const orderData = {
        items: cart.map((item) => ({
          product_id: item.id,
          variant_id: typeof item.selectedWeight === 'object' ? item.selectedWeight.id : undefined,
          quantity: item.quantity,
          weight: typeof item.selectedWeight === 'object' ? item.selectedWeight : { label: item.selectedWeight || '' },
          price: item.price,
        })),
        shipping_address: {
          address: formData.address,
          city: formData.city,
          zip_code: formData.zipCode,
          country: formData.country,
        },
        payment_method: gateway,
        coupon_code: discount > 0 ? promoCode : null,
        subtotal,
        shipping_fee: shipping,
        total_amount: total,
      };

      // Step 1: Create the order
      const orderResponse = await ordersApi.createOrder(orderData);
      if (!orderResponse.success) throw new Error('Order creation failed');

      const orderId = orderResponse.data?.order?.id || orderResponse.data?.orderId;

      // Step 2: Initiate payment based on gateway
      if (gateway === 'jazzcash') {
        const payResponse = await ordersApi.initiatePayment(orderId, 'jazzcash');
        const { postUrl, fields } = payResponse.data?.jazzcash_response || {};

        if (!postUrl || !fields) throw new Error('JazzCash response missing. Check credentials.');

        // Build and submit hidden form → redirects browser to JazzCash portal
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = postUrl;
        Object.entries(fields).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return; // Browser is redirecting — stop here
      }

      if (gateway === 'stripe') {
        const payResponse = await ordersApi.initiatePayment(orderId, 'stripe');
        const paymentUrl = payResponse.data?.payment_url;

        if (!paymentUrl) throw new Error('Stripe response missing payment URL.');

        window.location.href = paymentUrl;
        return; // Redirecting to Stripe hosted checkout
      }

      if (gateway === 'cod') {
        await ordersApi.initiatePayment(orderId, 'cod');
      }

      // COD → go to confirmation page
      clearCart();
      navigate('/order-confirmation', {
        state: {
          orderId: orderId || 'KS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        },
      });
    } catch (err) {
      console.error('Order failed:', err);
      setError(
        err.response?.data?.error?.message ||
        err.message ||
        'Unable to place order. Please check your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (cart.length === 0 && step === 1) {
      navigate('/shop');
    }
  }, [cart.length, step, navigate]);

  if (cart.length === 0 && step === 1) {
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-layout">

          {/* ── Main Checkout Flow ── */}
          <div className="checkout-main">

            {/* Step Indicators */}
            <div className="checkout-steps">
              <div className={`step ${step >= 1 ? 'active' : ''}`}>
                <span className="step-num">
                  {step > 1 ? <CheckCircle size={18} /> : '1'}
                </span>
                <span>Shipping</span>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step >= 2 ? 'active' : ''}`}>
                <span className="step-num">
                  {step > 2 ? <CheckCircle size={18} /> : '2'}
                </span>
                <span>Payment</span>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step >= 3 ? 'active' : ''}`}>
                <span className="step-num">3</span>
                <span>Review</span>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl mb-6 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Step Content */}
            <div className="step-content">
              <AnimatePresence mode="wait">

                {/* Step 1 — Shipping */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="form-step"
                  >
                    <h2 className="text-2xl font-bold mb-6">Shipping Details</h2>
                    <div className="space-y-4">
                      <Input
                        label="Email Address"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="you@example.com"
                        error={formErrors.email}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="First Name"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="first name "
                          error={formErrors.firstName}
                        />
                        <Input
                          label="Last Name"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="last name"
                          error={formErrors.lastName}
                        />
                      </div>
                      <Input
                        label="Street Address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="house and street address"
                        error={formErrors.address}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="City"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="city name"
                          error={formErrors.city}
                        />
                        <Input
                          label="ZIP / Postal Code"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          placeholder="postal code"
                          error={formErrors.zipCode}
                        />
                      </div>
                    </div>
                    <div className="pt-8">
                      <Button variant="primary" size="lg" className="w-full h-14 text-lg mt-6 shadow-premium hover:shadow-premium-hover active:scale-[0.98] transition-all" onClick={validateStep1} icon={ArrowRight}>
                        Continue to Payment
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2 — Payment */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="form-step"
                  >
                    <h2 className="text-2xl font-bold mb-6">Payment Options</h2>
                    <div className="space-y-4 mb-8">
                      <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${formData.paymentMethod === 'card' ? 'border-primary bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}>
                        <input type="radio" name="paymentMethod" value="card" checked={formData.paymentMethod === 'card'} onChange={handleInputChange} className="w-5 h-5 text-primary" />
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary">
                          <CreditCard size={24} />
                        </div>
                        <div className="flex-1">
                          <span className="block font-bold text-slate-800">Credit / Debit Card</span>
                          <p className="text-sm text-slate-500 m-0">Secure payment via Stripe</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${formData.paymentMethod === 'jazzcash' ? 'border-primary bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}>
                        <input type="radio" name="paymentMethod" value="jazzcash" checked={formData.paymentMethod === 'jazzcash'} onChange={handleInputChange} className="w-5 h-5 text-primary" />
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm font-black text-red-600 italic">JC</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">JazzCash / Easypaisa</span>
                            <Badge variant="success" className="text-[10px] scale-75">SECURE</Badge>
                          </div>
                          <p className="text-sm text-slate-500 m-0">Local mobile wallet payment</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${formData.paymentMethod === 'cod' ? 'border-primary bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}>
                        <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleInputChange} className="w-5 h-5 text-primary" />
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400">
                          <CheckCircle size={24} />
                        </div>
                        <div className="flex-1">
                          <span className="block font-bold text-slate-800">Cash on Delivery</span>
                          <p className="text-sm text-slate-500 m-0">Pay when you receive the order</p>
                        </div>
                      </label>
                    </div>

                    <Card className="bg-slate-50 border-none mb-8">
                      <p className="text-slate-500 text-sm m-0 italic">
                        {formData.paymentMethod === 'card'
                          ? 'You will be redirected to Stripe to securely enter your card details.'
                          : formData.paymentMethod === 'jazzcash'
                            ? 'You will be redirected to the JazzCash portal to complete your payment.'
                            : 'Order now and pay with cash when your package is delivered.'}
                      </p>
                    </Card>

                    <div className="flex gap-4">
                      <Button variant="admin-outline" size="lg" className="flex-1 h-14" onClick={() => setStep(1)} icon={ArrowLeft}>
                        Back
                      </Button>
                      <Button variant="primary" size="lg" className="flex-[2] h-14" onClick={() => setStep(3)} icon={ArrowRight}>
                        Review Order
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3 — Review */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="form-step"
                  >
                    <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <Card className="bg-slate-50 border-none p-5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Shipping to:</h3>
                        <p className="font-bold text-slate-800 m-0">{formData.firstName} {formData.lastName}</p>
                        <p className="text-sm text-slate-600 m-0 mt-1 italic">
                          {formData.address}, {formData.city}, {formData.zipCode}
                        </p>
                      </Card>
                      <Card className="bg-slate-50 border-none p-5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Payment:</h3>
                        <p className="font-bold text-slate-800 m-0">
                          {formData.paymentMethod === 'card'
                            ? 'Credit Card (Stripe)'
                            : formData.paymentMethod === 'jazzcash'
                              ? 'JazzCash Wallet'
                              : 'Cash on Delivery'}
                        </p>
                        <Badge variant="info" className="mt-2 text-[10px]">VERIFIED METHOD</Badge>
                      </Card>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="admin-outline" size="lg" className="flex-1 h-14" onClick={() => setStep(2)} icon={ArrowLeft}>
                        Back
                      </Button>
                      <Button
                        variant="primary"
                        size="lg"
                        className="flex-[2] h-14 text-lg"
                        onClick={handlePlaceOrder}
                        loading={loading}
                      >
                        {loading ? 'Processing...' : `Place Order • PKR ${Math.round(total).toLocaleString()}`}
                      </Button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* ── Order Summary Sidebar ── */}
          <aside className="checkout-summary h-fit">
            <Card className="bg-slate-50/50 border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Order Items</h3>
              <div className="space-y-4 mb-8">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.selectedWeight}`} className="flex gap-4 items-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <img src={item.images?.[0] || item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <Badge variant="info" className="absolute -top-2 -right-2 scale-75 px-2">
                        {item.quantity}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-slate-500">
                        {typeof item.selectedWeight === 'object' ? item.selectedWeight.label : item.selectedWeight}
                      </p>
                    </div>
                    <span className="font-bold text-slate-700 text-sm">
                      PKR {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-200 mb-6">
                <div className="flex justify-between text-sm text-slate-600 font-medium">
                  <span>Subtotal</span>
                  <span>PKR {subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-bold">
                    <span>Discount</span>
                    <span>-PKR {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-600 font-medium">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-emerald-600 font-bold' : ''}>
                    {shipping === 0 ? 'FREE' : `PKR ${shipping.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-200">
                  <span className="text-lg font-bold text-slate-800">Total</span>
                  <span className="text-2xl font-bold text-primary">PKR {Math.round(total).toLocaleString()}</span>
                </div>
              </div>

              <div className="promo-section pb-6 border-b border-slate-200 mb-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Promo Code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    containerClassName="mb-0 flex-1"
                    className="h-10"
                  />
                  <Button variant="admin-primary" size="sm" onClick={handleApplyPromo} loading={promoLoading} className="h-10">
                    Apply
                  </Button>
                </div>
                {promoMsg && (
                  <p className={`text-xs mt-2 font-bold ${promoMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {promoMsg.text}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>100% Secure Transaction</span>
              </div>
            </Card>
          </aside>

        </div>
      </div>


    </div>
  );
};

export default CheckoutPage;
