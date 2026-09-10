import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from '../components/ui';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    setGoogleConfigured(!!clientId);
  }, []);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleGoogleLogin = () => {
    if (!googleConfigured) {
      setError('Google Sign-In not configured. Please contact administrator.');
      return;
    }
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = isLogin
        ? await login(form.email, form.password)
        : await register(form);
      if (!isLogin) {
        await login(form.email, form.password);
      }
      navigate(user?.role === 'admin' ? '/admin' : '/account', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || requestError.message || 'Unable to sign in. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="card-header">
          <h1>{isLogin ? 'Welcome Back' : 'Join Our Store'}</h1>
          <p>{isLogin ? 'Sign in to access your account and orders.' : 'Create an account to start shopping and track your orders.'}</p>
        </div>
        {error && <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl mb-6 text-sm">{error}</div>}

        {googleConfigured && (
          <Button
            type="button"
            variant="admin-outline"
            className="w-full mb-4"
            onClick={handleGoogleLogin}
            icon={Globe}
            loading={loading}
          >
            Continue with Google
          </Button>
        )}

        {googleConfigured && (
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or continue with email</span>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="login-form space-y-4">
          {!isLogin && <Input label="Full Name" name="name" value={form.name} onChange={update} required />}
          <Input label="Email Address" type="email" name="email" value={form.email} onChange={update} required />
          <Input label="Password" type="password" name="password" value={form.password} onChange={update} required minLength={8} />
          {!isLogin && <Input label="Phone" name="phone" value={form.phone} onChange={update} />}
          <Button type="submit" variant="primary" loading={loading} className="w-full" icon={ArrowRight}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
        <button type="button" className="mt-6 w-full text-sm font-semibold text-primary" onClick={() => { setIsLogin((value) => !value); setError(''); }}>
          {isLogin ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </Card>
    </div>
  );
};

export default LoginPage;
