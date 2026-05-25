import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';

import './index.css';

ReactDOM.createRoot(
  document.getElementById('root')
).render(

  <ErrorBoundary>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </ErrorBoundary>

);
