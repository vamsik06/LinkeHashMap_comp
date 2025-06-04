import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import LinkedHashMapVisualizer from './components/LinkedHashMapVisualizer'

// Add dark mode state and logic
import { useState, useEffect } from 'react';

function App() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  return <LinkedHashMapVisualizer dark={dark} onToggleTheme={() => setDark(d => !d)} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 