import { motion } from "framer-motion";
import '../styles/landingpage.css'

const features = [
  {
    title: "End-to-End Encryption",
    description:
      "All student-teacher and AI communications are encrypted to ensure secure academic interactions.",
  },
  {
    title: "Role-Based Access Control",
    description:
      "Strict access layers ensure students, teachers, and administrators operate within defined permissions.",
  },
  {
    title: "AI Data Isolation",
    description:
      "AI sessions are processed securely without cross-user data exposure or persistent tracking.",
  },
  {
    title: "No Data Monetization",
    description:
      "The platform does not sell or commercialize user academic data. Privacy is fundamental.",
  },
];

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.25,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const PrivacyArchitecture = () => {
  return (
    <section className="privacy-section" id="privacy">
      <div className="privacy-container">

        {/* Header */}
        <motion.div
          className="privacy-header"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <h2>Privacy & Security Architecture</h2>
          <p>
            Built with enterprise-grade security standards to protect
            academic data, AI interactions, and teacher communication.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="privacy-grid"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="privacy-card"
              variants={item}
              transition={{ duration: 0.6 }}
            >
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default PrivacyArchitecture;