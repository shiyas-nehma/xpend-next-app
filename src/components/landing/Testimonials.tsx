
'use client'

import React from 'react';

const TestimonialCard: React.FC<{ testimonial: any }> = ({ testimonial }) => (
    <div className="p-8 bg-brand-surface border border-brand-border rounded-2xl h-full flex flex-col">
        <p className="text-brand-text-secondary flex-grow">"{testimonial.quote}"</p>
        <div className="flex items-center mt-6">
            <img src={testimonial.avatar} alt={testimonial.name} className="w-10 h-10 rounded-full" />
            <div className="ml-3">
                <p className="font-semibold text-sm text-brand-text-primary">{testimonial.name}</p>
                <p className="text-xs text-brand-text-secondary">{testimonial.title}</p>
            </div>
        </div>
    </div>
);


const Testimonials: React.FC = () => {
    const testimonialsData = [
        {
            quote: "The AI assistant is a game-changer. I asked it to summarize my spending, and it instantly showed me where I could save money. Equota has completely transformed how I manage my finances.",
            name: "Sarah K.",
            title: "Freelance Designer",
            avatar: "https://i.pravatar.cc/40?u=sarah"
        },
        {
            quote: "As a small business owner, the AI receipt scanning is a lifesaver. No more manual data entry for expenses. It's incredibly simple and accurate. Highly recommended!",
            name: "Michael R.",
            title: "Owner, The Coffee Spot",
            avatar: "https://i.pravatar.cc/40?u=michael"
        },
        {
            quote: "We're finally on track with our savings goals, thanks to Equota. Setting up a goal for our family vacation and watching the progress bar fill up is so motivating. The best financial app I've used.",
            name: "Jessica L.",
            title: "Marketing Manager",
            avatar: "https://i.pravatar.cc/40?u=jessica"
        }
    ];
    return (
        <section id="testimonials" className="py-20 md:py-28 bg-brand-surface/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-brand-text-primary">Loved by users worldwide.</h2>
                    <p className="max-w-xl mx-auto text-md text-brand-text-secondary mt-4">
                        Don't just take our word for it. Here's what our customers are saying.
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {testimonialsData.map(testimonial => (
                        <TestimonialCard key={testimonial.name} testimonial={testimonial} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
