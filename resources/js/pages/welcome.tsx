import FAQs from '@/components/faqs-section';
import FeaturesSection from '@/components/features';
import FeaturesMulti from '@/components/features-multi';
import HowItWorks from '@/components/how-it-works';
import Integrations from '@/components/integrations-two';
import ProblemSolutionSection from '@/components/prob-sol';
import Pricing from './landing/Pricing';
import Feature from './landing/Feature';
import Hero from './landing/hero';
import LandingLayout from './landing/landing-layout';
import ThreeCards from './landing/3-cards';
import TestimonialCard from './landing/testimonials';
import CTA from './landing/cta';
import About from './landing/about';

export default function Welcome() {
    return (
        <>
            <LandingLayout>
                <Hero />

                <Feature id="features" />
                <About/>
                <ThreeCards />
                <ProblemSolutionSection />
                <HowItWorks />
                <TestimonialCard />
                <Pricing />
                <CTA/>
            </LandingLayout>
        </>
    );
}
