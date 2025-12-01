import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';

// Configure axios defaults for the entire app
const API_URL = process.env.REACT_APP_API_URL || 'https://munagala-harvestors-ne60no599.vercel.app';
axios.defaults.baseURL = `${API_URL}/api`;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
