// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import './index.css';
// import App from './App';
// import reportWebVitals from './reportWebVitals';
// import { BrowserRouter } from "react-router-dom";
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// import { Toaster } from 'sonner';
// import { UserProvider } from './context/userContext';
// import { AuthProvider } from './context/AuthContext';
// import { StatsProvider } from './context/StatsContext';
// import { TeacherProvider } from './context/TeacherContext';  // ✅ ADD THIS IMPORT

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <AuthProvider>
//         <UserProvider>
//           <StatsProvider>
//             <TeacherProvider>      {/* ✅ ADD TeacherProvider HERE */}
//               <App />
//               <Toaster position="bottom-right" richColors />
//             </TeacherProvider>
//           </StatsProvider>
//         </UserProvider>
//       </AuthProvider>
//     </BrowserRouter>
//   </React.StrictMode>
// );

// reportWebVitals();

// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Toaster } from 'sonner';
import { UserProvider } from './context/userContext';
import { AuthProvider } from './context/AuthContext';
import { StatsProvider } from './context/StatsContext';
import { TeacherProvider } from './context/TeacherContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <StatsProvider>
            <TeacherProvider>
              <App />
              {/* ✅ Single Global Toaster - Remove all other Toasters from components */}
              <Toaster 
                position="top-right"
                richColors
                closeButton
                duration={4000}
                visibleToasts={1}
                gap={12}
                toastOptions={{
                  style: {
                    background: 'var(--bg-card, #1a1a2e)',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                    borderRadius: '12px',
                    color: 'var(--text-primary, #fff)',
                  },
                  success: {
                    icon: '✅',
                    duration: 3000,
                  },
                  error: {
                    icon: '❌',
                    duration: 5000,
                  },
                  info: {
                    icon: 'ℹ️',
                    duration: 4000,
                  },
                }}
              />
            </TeacherProvider>
          </StatsProvider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();