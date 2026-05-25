import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SchoolIcon from "@mui/icons-material/School";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import QuizIcon from "@mui/icons-material/Quiz";
import '../../styles/landingpage.css';

const slides = [
  {
    image:
      "/images/hero1.avif",
    title: "Smarter Learning with AI",
    subtitle:
      "Personalized dashboards, intelligent quizzes, and real-time analytics."
  },
  {
    image:
      "/images/hero2.webp",
    title: "Empower Teachers & Students",
    subtitle:
      "HolistiLearn transforms traditional education into digital intelligence."
  }
];

const features = [
  {
    icon: <AnalyticsIcon fontSize="large" />,
    title: "AI Analytics",
    desc: "Track progress with intelligent insights."
  },
  {
    icon: <QuizIcon fontSize="large" />,
    title: "Smart Quizzes",
    desc: "Adaptive quizzes powered by AI."
  },
  {
    icon: <SchoolIcon fontSize="large" />,
    title: "Role Dashboards",
    desc: "Separate Panels for Teachers & Students."
  }
];

const Hero = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="premium-hero"
      style={{
        backgroundImage: `url(${slides[index].image})`
      }}
    >
      <div className="hero-overlay-landing">

        {/* Animated Text */}
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-content-landing"
        >
          <h1 className="span-tag">{slides[index].title}</h1>
          <p>{slides[index].subtitle}</p>
        </motion.div>

        {/* Feature Cards */}
        <div className="hero-feature-cards">
          {features.map((item, i) => (
            <motion.div
              key={i}
              className="hero-card"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.2 }}
            >
              <div className="icon-side">{item.icon}</div>
              <div className="text-side">
                <h5>{item.title}</h5>
                <p>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Hero;
