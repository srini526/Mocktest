import React from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import Hero from '../Sections/Hero';
import Features from '../Sections/Features';
import WhyChoose from '../Sections/WhyChoose';
import InterviewPrep from '../Sections/InterviewPrep';
import SubscriptionSection from '../Sections/SubscriptionSection';

const LandingPage = () => (
  <div className="min-h-screen w-full bg-slate-50">
    <Header />
    <main>
      <Hero />
      <Features />
      <WhyChoose />
      <InterviewPrep />
      <SubscriptionSection />
    </main>
    <Footer />
  </div>
);

export default LandingPage;
