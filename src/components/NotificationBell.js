// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { FaBell, FaBellSlash } from 'react-icons/fa';
// import NotificationPanel from './NotificationPanel';
// import notificationService from '../../services/notificationService';
// import './NotificationBell.css';

// const NotificationBell = ({ role = 'student' }) => {
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [isPanelOpen, setIsPanelOpen] = useState(false);
//   const [isAnimating, setIsAnimating] = useState(false);
//   const [isMounted, setIsMounted] = useState(false);
//   const bellRef = useRef(null);
//   const timeoutRef = useRef(null);

//   useEffect(() => {
//     setIsMounted(true);
    
//     // Load initial unread count
//     setUnreadCount(notificationService.getUnreadCount());
    
//     // Subscribe to unread count changes
//     const unsubscribe = notificationService.on('unreadCountChanged', (count) => {
//       setUnreadCount(count);
      
//       // Animate bell when new notification arrives
//       if (count > 0) {
//         setIsAnimating(true);
//         if (timeoutRef.current) clearTimeout(timeoutRef.current);
//         timeoutRef.current = setTimeout(() => setIsAnimating(false), 1000);
//       }
//     });
    
//     // Also listen for new notifications to trigger animation
//     const unsubscribeNew = notificationService.on('new', () => {
//       setIsAnimating(true);
//       if (timeoutRef.current) clearTimeout(timeoutRef.current);
//       timeoutRef.current = setTimeout(() => setIsAnimating(false), 1000);
//     });
    
//     // Request desktop permission on mount if enabled
//     if (localStorage.getItem('notif_desktop') === 'true') {
//       notificationService.requestDesktopPermission();
//     }
    
//     return () => {
//       unsubscribe();
//       unsubscribeNew();
//       if (timeoutRef.current) clearTimeout(timeoutRef.current);
//     };
//   }, []);

//   // Update unread count when panel is closed (user might have read notifications)
//   useEffect(() => {
//     if (!isPanelOpen) {
//       // Small delay to ensure panel operations are complete
//       const timer = setTimeout(() => {
//         setUnreadCount(notificationService.getUnreadCount());
//       }, 300);
//       return () => clearTimeout(timer);
//     }
//   }, [isPanelOpen]);

//   const handleBellClick = () => {
//     setIsPanelOpen(!isPanelOpen);
//     // Reset animation when opening panel
//     if (isAnimating) {
//       setIsAnimating(false);
//     }
//   };

//   const handlePanelClose = () => {
//     setIsPanelOpen(false);
//   };

//   // Get role-specific link prefix for notifications
//   const getRolePrefix = () => {
//     switch(role) {
//       case 'teacher': return '/teacher/dashboard';
//       case 'admin': return '/admin';
//       default: return '/student';
//     }
//   };

//   // If component isn't mounted yet, show placeholder
//   if (!isMounted) {
//     return (
//       <div className="notification-bell-placeholder">
//         <FaBell />
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className="notification-bell-container" ref={bellRef}>
//         <motion.button
//           className={`notification-bell ${isAnimating ? 'animate' : ''} ${unreadCount > 0 ? 'has-notifications' : ''}`}
//           onClick={handleBellClick}
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           animate={isAnimating ? {
//             rotate: [0, -15, 15, -10, 10, -5, 5, 0],
//             transition: { duration: 0.5 }
//           } : {}}
//         >
//           <FaBell size={20} />
//           {unreadCount > 0 && (
//             <motion.span 
//               className="notification-badge"
//               initial={{ scale: 0 }}
//               animate={{ scale: 1 }}
//               transition={{ type: 'spring', stiffness: 500, damping: 30 }}
//             >
//               {unreadCount > 99 ? '99+' : unreadCount}
//             </motion.span>
//           )}
//         </motion.button>
        
//         {/* Optional: Show indicator dot when panel is open */}
//         {isPanelOpen && (
//           <div className="bell-active-indicator" />
//         )}
//       </div>
      
//       {/* Notification Panel */}
//       <NotificationPanel 
//         isOpen={isPanelOpen} 
//         onClose={handlePanelClose}
//         role={role}
//         rolePrefix={getRolePrefix()}
//       />
//     </>
//   );
// };

// export default NotificationBell;

