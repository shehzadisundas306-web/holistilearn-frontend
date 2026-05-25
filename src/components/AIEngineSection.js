import React, { useState} from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { GiBrain } from "react-icons/gi";
import { VscGraph } from "react-icons/vsc";
import { FaLock } from "react-icons/fa6";
import { MdElectricBolt } from "react-icons/md";
import '../styles/landingpage.css';

const AIEngineSection = () => {
  const [messages, setMessages] = useState([
    { role: 'user', text: "Explain Newton’s Second Law." },
    { role: 'ai', text: "Newton’s Second Law states that Force equals mass multiplied by acceleration (F = ma)." }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const demoPrompts = [
    "Generate a quiz",
    "Summary of Biology Ch. 1",
    "Solve 2x + 5 = 15"
  ];

  const handlePromptClick = (prompt) => {
    if (isTyping) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    setIsTyping(true);

    // Simulate AI thinking and typing
    setTimeout(() => {
      let response = "";
      if (prompt.includes("quiz")) response = "I've generated a 5-question quiz on your current topic. Ready to start?";
      else if (prompt.includes("Biology")) response = "Chapter 1 focuses on Cell Structure. Key parts include the Nucleus and Mitochondria.";
      else response = "Subtract 5 from both sides: 2x = 10. Then divide by 2: x = 5.";

      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <section className="ai-section" id="ai-engine">
      <div className="ai-container">
        
        {/* LEFT SIDE - INTERACTIVE CHAT UI */}
        <motion.div
          className="ai-chat-wrapper"
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          viewport={{ once: true }}
        >
          <div className="ai-glow"></div>

          <div className="chat-card premium-glass">
            <div className="chat-header-landing">
              <div className="dot red"></div>
              <div className="dot yellow"></div>
              <div className="dot green"></div>
              <span>HolistiLearn AI</span>
            </div>

            <div className="chat-body" id="chat-body">
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    className={msg.role === 'user' ? "user-msg" : "ai-msg"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {msg.text}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isTyping && (
                <motion.div className="ai-typing-indicator">
                  <span></span><span></span><span></span>
                </motion.div>
              )}
            </div>

            {/* INTERACTIVE FOOTER */}
            <div className="chat-footer">
              <p className="suggest-label">Try a prompt:</p>
              <div className="prompt-pills">
                {demoPrompts.map((p, i) => (
                  <button key={i} onClick={() => handlePromptClick(p)} className="pill-btn">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

         {/* RIGHT SIDE - CONTENT */}
         <motion.div
          className="ai-content-home"
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          viewport={{ once: true }}
        >
          <h2>
            Intelligent Academic <span>AI Assistance</span>
          </h2>

          <p>
            HolistiLearn leverages advanced AI models to provide real-time,
            context-aware academic support. Students receive adaptive
            explanations, instant clarifications, and smart quiz generation —
            all within a secure and privacy-first environment.
          </p>

          <div className="ai-features">
            <div className="feature-item">
              <MdElectricBolt className="text-warning"/> Real-time academic responses
            </div>

            <div className="feature-item ">
              <GiBrain className="text-success"/> Context-aware explanations
            </div>

            <div className="feature-item">
              <VscGraph className="text-danger"/> Adaptive quiz generation
            </div>

            <div className="feature-item">
              <FaLock className="text-warning"/> Secure role-based access
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default AIEngineSection;