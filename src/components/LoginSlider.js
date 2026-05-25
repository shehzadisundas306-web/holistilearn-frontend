import { useState, useEffect } from "react";
import { motion } from "framer-motion";


const slides = [
  {
    id: 1,
    image: "/images/login1.jpg",
    text: "AI Powered Learning Experience",
  },
  {
    id: 2,
    image: "/images/login2.webp",
    text: "Smart Emotion-Based Study System",
  },
  {
    id: 3,
    image: "/images/login3.jpg",
    text: "Track Performance with Intelligence",
  },
];

const LoginSlider = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="login-slider">

      {slides.map((slide, i) => (
        <motion.div
          key={slide.id}
          className="slide"
          style={{
            backgroundImage: `linear-gradient(rgba(9,16,87,0.65), rgba(2,76,170,0.65)), url(${slide.image})`,
          }}
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          {i === index && (
            <motion.h1
              key={index}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              {slide.text}
            </motion.h1>
          )}
        </motion.div>
      ))}

      {/* DOTS */}
      <div className="slider-dots">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`dot ${index === i ? "active" : ""}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default LoginSlider;
