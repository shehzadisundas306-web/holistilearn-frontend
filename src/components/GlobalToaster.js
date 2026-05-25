// frontend/src/components/GlobalToaster.js
import { Toaster } from "sonner";

const GlobalToaster = () => {
  return (
    <Toaster 
      position="bottom-right"
      richColors={false}
    //   closeButton={true}
      duration={4000}
      visibleToasts={3}
      gap={12}
      toastOptions={{
        style: {
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          color: '#fff',
          padding: '12px 16px',
          fontSize: '14px',
        },
        className: 'global-toast',
      }}
    />
  );
};

export default GlobalToaster;