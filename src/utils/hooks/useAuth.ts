import { useEffect, useRef } from 'react';

import UsersService from '@/services/users.service';
import { setAuthenticating, setUser } from '@/valtio/auth/auth.actions';
import { useAuthStore } from '@/valtio/auth/auth.store';

const useAuth = () => {
  const { token } = useAuthStore();
  const initialLoadRef = useRef<boolean>(true);

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
