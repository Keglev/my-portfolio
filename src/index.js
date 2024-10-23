import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import base styles for the project
import App from './App'; // Import the main App component

// Render the root React component into the DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode is a tool for highlighting potential issues in the application
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
