import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    WelcomeVisual, 
    TransactionsVisual, 
    BudgetsVisual, 
    GoalsVisual, 
    AIInsightsVisual, 
    FinalSetupVisual
} from '../../components/onboarding/OnboardingVisuals';
import { CheckIcon } from '../../components/icons/NavIcons';

interface OnboardingPageProps {
  onFinish: (dontShowAgain: boolean) => void;
}

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0,
    }),
};

const ProgressIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => {
    const percentage = Math.round(((current + 1) / total) * 100);
    return (
        <div className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                {Array.from({ length: total }).map((_, index) => (
                    <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                            index <= current ? 'bg-brand-blue' : 'bg-brand-surface-2'
                        }`}
                    />
                ))}
            </div>
            <p className="text-sm font-medium text-brand-text-secondary">
                Step {current + 1} of {total} &middot; {percentage}%
            </p>
        </div>
    );
};

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onFinish }) => {
    const [[page, direction], setPage] = useState([0, 0]);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleFinish = () => onFinish(dontShowAgain);

    const steps = [
        {
            headline: "Take control of your money with ease",
            subtext: "Track expenses, set budgets, and reach your financial goals.",
            visual: <WelcomeVisual />,
        },
        {
            headline: "Track every expense & income",
            subtext: "Log daily transactions and instantly see where your money goes.",
            visual: <TransactionsVisual />,
        },
        {
            headline: "Stay on top of your budgets",
            subtext: "Create category-based budgets and avoid overspending.",
            visual: <BudgetsVisual />,
        },
        {
            headline: "Achieve your financial goals",
            subtext: "Save for vacations, gadgets, or investments.",
            visual: <GoalsVisual />,
        },
        {
            headline: "Smarter money management with AI",
            subtext: "Get personalized insights, alerts, and saving suggestions.",
            visual: <AIInsightsVisual />,
        },
        {
            headline: "You’re ready to go!",
            subtext: "Choose where to start.",
            visual: <FinalSetupVisual onFinish={handleFinish} />,
        }
    ];

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    const handleNext = () => paginate(1);
    const handleBack = () => paginate(-1);
    const handleSkip = () => setPage([steps.length - 1, 1]);

    const currentStep = steps[page];
    const isFinalStep = page === steps.length - 1;

    return (
        <div className="bg-brand-bg text-brand-text-primary font-sans antialiased min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg mx-auto flex flex-col h-[80vh] max-h-[700px]">
                <div className="pt-4">
                    <ProgressIndicator current={page} total={steps.length} />
                </div>
                
                <div className="flex-grow flex flex-col items-center justify-center relative overflow-hidden my-6">
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={page}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="absolute w-full h-full flex flex-col items-center justify-center text-center"
                        >
                            <div className="mb-8">{currentStep.visual}</div>
                            <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary mb-3">{currentStep.headline}</h1>
                            <p className="max-w-md text-brand-text-secondary">{currentStep.subtext}</p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-auto pb-4 space-y-4">
                    {isFinalStep && (
                        <div className="flex items-center justify-center">
                            <label htmlFor="dont-show-again" className="flex items-center gap-2 cursor-pointer text-sm text-brand-text-secondary">
                                 <input
                                    id="dont-show-again"
                                    type="checkbox"
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                    className="hidden"
                                />
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${dontShowAgain ? 'bg-brand-blue border-brand-blue' : 'bg-transparent border-brand-border'}`}>
                                    {dontShowAgain && <CheckIcon className="w-3 h-3 text-white" />}
                                </div>
                                Don't show this again
                            </label>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <div>
                            {page > 0 && !isFinalStep && (
                                <button onClick={handleBack} className="px-5 py-2.5 text-sm font-semibold text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                                    Back
                                </button>
                            )}
                        </div>
                        <div className="flex-grow text-center">
                             {!isFinalStep && (
                                <button onClick={handleSkip} className="px-5 py-2.5 text-sm font-semibold text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                                    Skip for now
                                </button>
                            )}
                        </div>
                        <div>
                            {isFinalStep ? (
                                <button onClick={handleFinish} className="px-5 py-2.5 text-sm font-bold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_10px_rgba(255,255,255,0.1)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                                    Go to Dashboard
                                </button>
                            ) : (
                                <button onClick={handleNext} className="px-5 py-2.5 text-sm font-bold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_10px_rgba(255,255,255,0.1)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                                    Next
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;