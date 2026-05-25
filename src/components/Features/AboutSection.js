import { motion } from "framer-motion";
import SchoolIcon from "@mui/icons-material/School";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import GroupsIcon from "@mui/icons-material/Groups";
import '../../styles/landingpage.css';

const AboutSection = () => {
  return (
    <section className="about-section">
      <div className="container about-grid">

        {/* LEFT SIDE */}
        <div className="about-left">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Welcome to HolistiLearn
          </motion.h2>

          <p className="about-subtext">
            HolistiLearn is an AI-powered education platform designed
            to empower students and teachers with intelligent insights,
            smart assessments, and collaborative learning tools.
          </p>

          <div className="about-features">

            <Feature
              icon={<AnalyticsIcon />}
              title="AI-Powered Learning"
              desc="Track student performance with predictive analytics and smart reports."
            />

            <Feature
              icon={<SchoolIcon />}
              title="Expert Educators"
              desc="Qualified teachers delivering structured and personalized content."
            />

            <Feature
              icon={<GroupsIcon />}
              title="Collaborative Community"
              desc="Connect students and teachers through interactive dashboards."
            />

          </div>
        </div>

        {/* RIGHT SIDE */}
        <motion.div
          className="about-right"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="image-stack">
            <img
              src="/images/aboutsection1.jpg"
              alt="students"
              className="img-top"
            />
            <img
              src="/images/aboutsection2.jpg"
              alt="teacher"
              className="img-bottom"
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
};

const Feature = ({ icon, title, desc }) => (
  <motion.div
    className="about-feature-item"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
  >
    <div className="feature-icon">{icon}</div>
    <div>
      <h5>{title}</h5>
      <p>{desc}</p>
    </div>
  </motion.div>
);

export default AboutSection;
