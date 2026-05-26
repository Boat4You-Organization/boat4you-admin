import AuthService from '@/services/auth.service';
import { setAuthenticating, setToken, setUser } from '@/valtio/auth/auth.actions';

const useLogout = () => {
  const handleLogout = async () => {
    setAuthenticating(true);
    await AuthService.logout();
    setToken(null);
    setUser(null);
  };

  return handleLogout;
};

export default useLogout;
