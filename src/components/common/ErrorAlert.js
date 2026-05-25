import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorAlert = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 relative">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
        <p className="text-red-700 flex-1 text-sm">{message}</p>
        {onClose && (
          <button 
            onClick={onClose} 
            className="text-red-500 hover:text-red-700 flex-shrink-0"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;