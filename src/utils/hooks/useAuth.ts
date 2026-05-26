import { useEffect, useRef } from 'react';

import { AuthKeys } from '@/config/constants.config';
import UsersService from '@/services/users.service';
import { setAuthenticating, setUser } from '@/valtio/auth/auth.actions';
import { useAuthStore } from '@/valtio/auth/auth.store';

const useAuth = () => {
  const { token } = useAuthStore();
  const initialLoadRef = useRef<boolean>(true);

  useEffect(() => {
    const handleTokenChange = () => {
      const storedToken = localStorage.getItem(AuthKeys.TOKEN);

      if (token === storedToken) return;

      if (token) {
        localStorage.setItem(AuthKeys.TOKEN, token);
      } else {
        localStorage.removeItem(AuthKeys.TOKEN);
      }
    };

    handleTokenChange();
  }, [token]);

  useEffect(() => {
    const authenticate = async () => {
      if (!token) {
        initialLoadRef.current = true;
        setAuthenticating(false);

        return;
      }

      if (initialLoadRef.current && token) {
        initialLoadRef.current = false;

        const response = await UsersService.getUserByToken(token);

        setUser(response);
      }

      setAuthenticating(false);
    };

    authenticate();
  }, [token]);
};

export default useAuth;
