
import React from 'react';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import BentoGridFeatures from '../components/landing/BentoGridFeatures';
import Pricing from '../components/landing/Pricing';
import Testimonials from '../components/landing/Testimonials';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

interface LandingPageProps {
  onEnterApp: (page: 'login' | 'signup') => void;
  onNavigateToBlog: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onNavigateToBlog }) => {
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
};

export default LandingPage;