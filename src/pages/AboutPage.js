import { useRef } from "react";
import AboutHero from "../components/About/AboutHero";
import Mission from "../components/About/Mission";
import HowItWorks from "../components/About/HowItWorks";
import AboutFeatures from "../components/About/AboutFeatures";
import Vision from "../components/About/Vision";
import AboutCTA from "../components/About/AboutCTA";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/CTA/CTA";
import ScrollReveal from "../components/ScrollReveal";
import '../styles/about.css'
import '../styles/responsive.css'

const About = () => {
  const visionRef = useRef(null);

  const scrollToVision = () => {
    const navbarOffset = 100; // adjust if needed
    const element = visionRef.current;

    if (element) {
      const y =
        element.getBoundingClientRect().top +
        window.pageYOffset -
        navbarOffset;

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="about-page">
      <ScrollReveal/>
      <Topbar />
      <Navbar />

      {/* Pass scroll function */}
      <AboutHero onVisionClick={scrollToVision} />

      <Mission />
      <HowItWorks />
      <AboutFeatures />

      {/* Attach ref here */}
      <div ref={visionRef}>
        <Vision />
      </div>

      <AboutCTA />
      <Footer />
    </div>
  );
};

export default About;