import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/config/globalErrorHandler';
import ReactErrorHandler from '@/config/ReactErrorHandler';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ReactErrorHandler>
      <App />
    </ReactErrorHandler>
  </React.StrictMode>
);

