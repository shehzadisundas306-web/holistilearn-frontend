import { motion } from "framer-motion";
import '../../styles/about.css'

const AboutCTA = () => {
  return (
    <section className="about-cta-minimal">
      <motion.div 
        className="cta-content-simple"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <span className="simple-badge">Join the Journey</span>
        
        <h2 className="simple-title">
          Ready to transform your <span className="text-blue">learning experience?</span>
        </h2>
        
        <p className="simple-description">
          Empower your education with AI-driven insights. Start your holistic 
          learning journey today with HolistiLearn.
        </p>

        <div className="simple-actions">
          <button className="btn-primary-simple">Get Started Now</button>
          <button className="btn-text-simple">Contact Support →</button>
        </div>
      </motion.div>
    </section>
  );
};

export default AboutCTA;