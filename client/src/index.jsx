import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { ToastProvider } from './components/ToastContext.jsx';
import { CurrentUserProvider } from './components/CurrentUserContext.jsx';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <ToastProvider>
      <CurrentUserProvider>
        <App />
      </CurrentUserProvider>
    </ToastProvider>
  </BrowserRouter>
);
