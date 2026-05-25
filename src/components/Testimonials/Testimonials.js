import { motion } from "framer-motion";
import StarIcon from "@mui/icons-material/Star";
import '../../styles/landingpage.css';

const Testimonials = () => {
  const data = [
    {
      name: "Ayesha Khan",
      role: "Student",
      text: "HolistiLearn completely transformed my study routine. The AI-powered quizzes helped me improve faster than ever.",
      image: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      name: "Ahmed Raza",
      role: "Teacher",
      text: "Tracking student performance is now effortless. The dashboard gives me real-time insights into progress.",
      image: "https://randomuser.me/api/portraits/men/46.jpg"
    },
    {
      name: "Fatima Noor",
      role: "Student",
      text: "The personalized learning path keeps me motivated. I can clearly see my improvement over time.",
      image: "https://randomuser.me/api/portraits/women/65.jpg"
    }
  ];

  return (
    <section className="testimonial-section">
      <div className="container">

        <h2 className="testimonial-heading">
          What Our Users Say
        </h2>
        <p className="testimonial-subtext">
          Trusted by students and educators who believe in smarter digital learning.
        </p>

        <div className="testimonial-grid">
          {data.map((t, index) => (
            <motion.div
              key={index}
              className="testimonial-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <div className="testimonial-top">
                <img src={t.image} alt={t.name} />
                <div>
                  <h4>{t.name}</h4>
                  <span className="testimonial-role">{t.role}</span>
                </div>
              </div>

              <p className="testimonial-text">
                "{t.text}"
              </p>

              <div className="testimonial-stars">
                <StarIcon />
                <StarIcon />
                <StarIcon />
                <StarIcon />
                <StarIcon />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
