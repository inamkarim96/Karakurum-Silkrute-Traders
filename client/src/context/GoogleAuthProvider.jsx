import { useEffect } from 'react';

export const GoogleAuthProvider = ({ children }) => {
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === '123456789-abcdefghijklmnop.apps.googleusercontent.com') {
      return;
    }

    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    }

    const checkLoaded = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(checkLoaded);
      }
    }, 100);

    return () => clearInterval(checkLoaded);
  }, []);

  return <>{children}</>;
};