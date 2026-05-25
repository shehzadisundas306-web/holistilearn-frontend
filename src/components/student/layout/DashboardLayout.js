import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

const StudentDashboardLayout = () => {
  // Check initial width to set accurate starting state
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 992);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 992) {
        setIsCollapsed(true); 
      }
    };
    
    // Call handleResize right away to catch initial render constraints
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`student-layout-container ${
        isCollapsed ? "student-sidebar-collapsed" : "student-sidebar-expanded"
      } ${isMobileOpen ? "student-mobile-drawer-active" : ""}`}
    >
      {/* 1. Backdrop Overlay for Mobile Drawer */}
      {isMobileOpen && (
        <div 
          className="student-layout-backdrop" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* 2. Sidebar with Unique State Hooks passed down */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Framework Wrap Area */}
      <div className="student-layout-main">
        {/* 3. TopNavbar (Trigger Mobile Sidebar Drawer Toggle Open) */}
        <TopNavbar onMenuClick={() => setIsMobileOpen(true)} />

        <div className="student-layout-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardLayout;