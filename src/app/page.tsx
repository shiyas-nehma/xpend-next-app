import styles from "./page.module.css";
// import Image from "next/image"; // Removed since it's not used here
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import BentoGridFeatures from '../components/landing/BentoGridFeatures';
import Pricing from '../components/landing/Pricing';
import Testimonials from '../components/landing/Testimonials';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

// 1. Correctly define the component's props interface
interface LandingPageProps {
  onEnterApp: (page: 'login' | 'signup') => void;
  onNavigateToBlog: () => void;
}

// 2. Correctly define the functional component using the interface
export default function LandingPage({ onEnterApp, onNavigateToBlog }: LandingPageProps) {
   return (
     <div className="bg-brand-bg font-sans text-brand-text-primary antialiased">
        <div id="background-container" className="fixed inset-0 -z-10">
            <div className="absolute top-0 left-0 w-1/2 h-full bg-[radial-gradient(circle_at_top_left,_rgba(93,120,255,0.15),_transparent_40%)]"></div>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_top_right,_rgba(255,199,0,0.1),_transparent_40%)]"></div>
        </div>
        
        <Header onEnterApp={onEnterApp} onNavigateToBlog={onNavigateToBlog} />
        
        <main>
            <Hero onEnterApp={onEnterApp} />
            <BentoGridFeatures />
            <Pricing onEnterApp={onEnterApp} />
            <Testimonials />
            <CTA onEnterApp={onEnterApp} />
        </main>
        
        <Footer onNavigateToBlog={onNavigateToBlog} />
    </div>
   );
}