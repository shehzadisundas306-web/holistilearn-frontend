// import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import Features from "../components/Features/Features";
import RoleHighlight from "../components/RoleHighlight/RoleHighlight";
import Testimonials from "../components/Testimonials/Testimonials";
import CTA from "../components/CTA/CTA";
import AboutSection from "../components/Features/AboutSection";
import Topbar from "../components/Navbar/Topbar";
import WhyChooseUs from "../components/Testimonials/WhyChooseUs";
import AIEngineSection from "../components/AIEngineSection";
import HowItWorks from "../components/HowItWorks";
import PrivacyArchitecture from "../components/PrivacyArchitecutre";
import '../styles/landingpage.css';
import ScrollReveal from "../components/ScrollReveal";
const LandingPage = () => {

  return (
    <div className="landing-container">
      <ScrollReveal/>
      <Topbar/>
      <Navbar/>
      <Hero/>
      <AIEngineSection/>
      <HowItWorks/>
      <AboutSection/>
      <RoleHighlight/>
      <Features/>
      <WhyChooseUs/>
      <PrivacyArchitecture/>
      <Testimonials/>
      <CTA/>
    </div>
  );
};

export default LandingPage;
