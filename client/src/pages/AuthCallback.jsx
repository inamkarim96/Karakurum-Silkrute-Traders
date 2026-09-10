import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  const token = searchParams.get('token');
  const userParam = searchParams.get('user');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      const errorMessages = {
        google_oauth_access_denied: 'Google sign-in was cancelled.',
        missing_code: 'Invalid response from Google.',
        oauth_failed: 'Google sign-in failed. Please try again.'
      };
      const message = errorMessages[error] || 'Authentication failed.';
      navigate(`/login?error=${encodeURIComponent(message)}`);
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        setUser(user);
        navigate(user?.role === 'admin' ? '/admin' : '/account', { replace: true });
      } catch (err) {
        console.error('Failed to parse user data:', err);
        navigate('/login?error=invalid_response');
      }
    } else {
      navigate('/login?error=invalid_callback');
    }
  }, [token, userParam, error, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-slate-600 font-medium">Completing sign in...</p>
      </motion.div>
    </div>
  );
};

export default AuthCallback;