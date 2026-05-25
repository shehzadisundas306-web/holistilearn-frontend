import React, { useState } from 'react';
import { motion } from "framer-motion";
// Keeping your exact path and styling
import '../../styles/landingpage.css';

const Footer = () => {
  // --- FUNCTIONALITY: Newsletter Logic ---
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Subscribe"); // To manage button text

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus("Sending...");
    
    // Simulate a professional API delay
    setTimeout(() => {
      setStatus("Success! ✓");
      setEmail("");
      // Reset button after 3 seconds
      setTimeout(() => setStatus("Subscribe"), 3000);
    }, 1500);
  };

  // --- FUNCTIONALITY: Smooth Scroll Helper ---
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <footer className="footer">
        <div className="footer-container">
          <motion.div
            className="footer-grid"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div>
              <h4>HolistiLearn</h4>
              <p>
                AI-powered academic assistance platform enabling
                dynamic course-free learning with secure teacher interaction.
              </p>
            </div>

            <div>
              <h4>Platform</h4>
              <ul>
                {/* Updated to clickable smooth-scroll links */}
                <li style={{cursor: 'pointer'}} onClick={() => scrollToSection('ai-engine')}>AI Academic Assistance</li>
                <li style={{cursor: 'pointer'}} onClick={() => scrollToSection('how-it-works')}>How It Works</li>
                <li style={{cursor: 'pointer'}} onClick={() => scrollToSection('privacy')}>Privacy Architecture</li>
              </ul>
            </div>

            <div>
              <h4>Learning Model</h4>
              <ul>
                <li>No Predefined Courses</li>
                <li>AI-Generated Content</li>
                <li>No Certificates</li>
                <li>Free Academic Access</li>
              </ul>
            </div>

            <div className="newsletter">
              <h4>Stay Updated</h4>
              {/* Added form and state handling */}
              <form onSubmit={handleSubscribe} className="newsletter-box">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit">{status}</button>
              </form>
            </div>
          </motion.div>

          <div className="footer-divider"></div>

          <div className="footer-bottom">
            {/* Dynamic Year functionality */}
            © {new Date().getFullYear()} HolistiLearn AI. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;