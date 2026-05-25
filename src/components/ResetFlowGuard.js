import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';


// ResetFlowGuard.js
export const ResetFlowGuard = ({ children, requiredKey }) => {
    const location = useLocation();
    
    // Debugging: See what the guard is receiving
    console.log("Guard checking for:", requiredKey);
    console.log("Current State:", location.state);

    const hasData = location.state && location.state[requiredKey];

    if (!hasData) {
        return <Navigate to="/forgot-password" replace />;
    }

    return children;
};