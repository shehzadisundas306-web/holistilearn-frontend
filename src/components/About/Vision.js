import { motion } from "framer-motion";
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import '../../styles/about.css'

const Vision = () => {
  return (
    <section className="vision-section-premium">
      <div className="container vision-container">
        
        {/* LEFT SIDE: Visual Element */}
        <motion.div 
          className="vision-visual"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <div className="vision-image-wrapper">
            <img src="https://ssbr-edu.ch/wp-content/uploads/2024/01/Digital-uni-with-student.jpg" alt="Future of AI Education" />
            <div className="vision-floating-badge">
              <AutoAwesomeIcon />
              <span>Next-Gen EdTech</span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT SIDE: Content */}
        <motion.div 
          className="vision-content"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="vision-icon-tag">
            <RemoveRedEyeIcon />
          </div>
          <h2 className="vision-title">Our Vision for <span className="blue-text">2030</span></h2>
          <p className="vision-text">
            To build a world where <strong>intelligence meets empathy</strong>. We envision 
            an educational landscape where technology doesn't just deliver content, 
            but understands the emotional and cognitive state of every learner.
          </p>
          
          <div className="vision-goals">
            <div className="goal-item">
              <div className="goal-dot"></div>
              <span>Bridging the gap between AI and Human Potential</span>
            </div>
            <div className="goal-item">
              <div className="goal-dot"></div>
              <span>Global Accessibility to Personalized Mentors</span>
            </div>
            <div className="goal-item">
              <div className="goal-dot"></div>
              <span>Data-Driven Well-being for every Student</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Vision;