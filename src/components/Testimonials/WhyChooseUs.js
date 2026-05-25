import { motion } from "framer-motion";
import { FaBrain, FaChartLine, FaUserGraduate, FaShieldAlt } from "react-icons/fa";
import '../../styles/landingpage.css';

const features = [
  {
    icon: <FaBrain />,
    title: "AI-Powered Learning",
    description:
      "Personalized learning paths tailored to each student's performance and behavior."
  },
  {
    icon: <FaChartLine />,
    title: "Advanced Analytics",
    description:
      "Real-time performance tracking with smart insights for teachers and institutions."
  },
  {
    icon: <FaUserGraduate />,
    title: "Student-Centered Approach",
    description:
      "Adaptive content that evolves based on progress, engagement, and mastery."
  },
  {
    icon: <FaShieldAlt />,
    title: "Secure & Reliable",
    description:
      "Enterprise-level security with scalable cloud infrastructure."
  }
];

const WhyChooseUs = () => {
  return (
    <section className="why-section">
      <div className="container">
        <motion.h2
          className="section-title-landing"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Why Choose Us?
        </motion.h2>

        <motion.p
          className="section-subtitle-landing"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Empowering students and educators with intelligent, data-driven tools.
        </motion.p>

        <div className="why-grid">
          {features.map((item, index) => (
            <motion.div
              key={index}
              className="why-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="why-icon">{item.icon}</div>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
