import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Best for server state
import { Toaster } from 'react-hot-toast'; // For notifications
import { AuthProvider } from './features/auth/authContext.tsx'
import { BrowserRouter } from 'react-router-dom';

import './App.css'
import { CssBaseline } from '@mui/material';
import AppRoutes from './routes/AppRoutes.tsx';
import Loader from './components/Loader.tsx';

function App() {
  const [count, setCount] = useState(0)
  const queryClient = new QueryClient();

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <CssBaseline />
            <AppRoutes />
          </BrowserRouter>
          <Toaster position="top-right" />

        </AuthProvider>
      </QueryClientProvider>
    </>
  )
}

export default App
