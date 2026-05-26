import { ThemeProvider } from '@mui/material';

import AppRouter from '@/routers/AppRouter';
import theme from '@/styles/themes';

import Toast from './components/Toast';
import useAuth from './utils/hooks/useAuth';

const App = () => {
  useAuth();

  return (
    <ThemeProvider theme={theme}>
      <AppRouter />
      <Toast />
    </ThemeProvider>
  );
};

export default App;
