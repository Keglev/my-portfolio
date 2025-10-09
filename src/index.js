import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import base styles for the project
import App from './App'; // Import the main App component
import ErrorBoundary from './components/ErrorBoundary';

console.log('Starting React render...');

// Render the root React component into the DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode is a tool for highlighting potential issues in the application
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
