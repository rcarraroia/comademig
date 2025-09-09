import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Carregar funções de diagnóstico no console
import './utils/quickDiagnostic'

createRoot(document.getElementById("root")!).render(<App />);
