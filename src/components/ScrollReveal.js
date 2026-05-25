import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

const ScrollReveal = () => {
  const [showButton, setShowButton] = useState(false);
  const { scrollYProgress } = useScroll();
  
  // Smooth out the progress bar movement
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* 1. Progress Bar */}
      <motion.div
        className="scroll-progress-bar"
        style={{ scaleX, position: 'fixed', top: 0, left: 0, right: 0, height: '4px', background: 'var(--blue)', zIndex: 9999, transformOrigin: '0%' }}
      />

      {/* 2. Back to Top Button */}
      {showButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={scrollToTop}
          className="back-to-top"
          style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, background: 'var(--blue)', color: 'var(--navy)', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
        >
          <ArrowUpwardIcon />
        </motion.button>
      )}
    </>
  );
};

export default ScrollReveal;