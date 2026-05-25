import { motion } from "framer-motion";
import '../../styles/about.css'

const AboutHero = ({ onVisionClick }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <section className="premium-hero about-integrated-hero">
      <div className="hero-overlay">
        <div className="about-hero-container">

          {/* LEFT CONTENT */}
          <motion.div
            className="about-hero-left"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.span
              className="hero-badge-integrated"
              variants={itemVariants}
            >
              Our Story
            </motion.span>

            <motion.h1
              className="about-title-light"
              variants={itemVariants}
            >
              Architecting the{" "}
              <span className="text-orange-glow">Future</span> of Learning
            </motion.h1>

            <motion.p
              className="about-desc-light"
              variants={itemVariants}
            >
              HolistiLearn is built on the MERN stack to provide a seamless,
              AI-driven ecosystem where student potential meets digital intelligence.
            </motion.p>

            <motion.div
              className="about-hero-btns"
              variants={itemVariants}
            >
              <button
                className="btn-outline-integrated "
                onClick={onVisionClick}
              >
                Our Vision
              </button>
            </motion.div>
          </motion.div>

          {/* RIGHT VISUAL */}
          <motion.div
            className="about-hero-right"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <div className="ai-visual-integrated">
              <div className="glass-blob-glow"></div>

              <motion.div
                className="floating-card-dark c1"
                animate={{ y: [0, -15, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut"
                }}
              >
                <span>AI</span> Patterns
              </motion.div>

              <motion.div
                className="floating-card-dark c2"
                animate={{ y: [0, 15, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <span>Live</span> Analytics
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default AboutHero;