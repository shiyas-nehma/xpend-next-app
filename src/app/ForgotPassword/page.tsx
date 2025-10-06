import React from 'react';

interface ForgotPasswordPageProps {
  onNavigate: (page: 'login') => void;
}

const Logo: React.FC = () => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center">
        <div className="w-1 h-4 bg-black rounded-full transform -skew-x-12" />
        <div className="w-1 h-5 bg-black rounded-full transform -skew-x-12 ml-1" />
      </div>
    </div>
);


const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle password reset logic here
    alert('Password reset link sent!');
    onNavigate('login');
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[radial-gradient(circle,rgba(93,120,255,0.2)_0%,transparent_80%)] animate-[spin_20s_linear_infinite]"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[radial-gradient(circle,rgba(255,199,0,0.15)_0%,transparent_80%)] animate-[spin_20s_linear_infinite_reverse]"></div>
      
      <div className="w-full max-w-sm bg-brand-surface/70 backdrop-blur-xl rounded-2xl shadow-2xl p-8 z-10 
                   border border-transparent 
                   [background:linear-gradient(theme(colors.brand.surface),theme(colors.brand.surface))_padding-box,linear-gradient(120deg,theme(colors.brand.border),theme(colors.brand.border)_50%,rgba(93,120,255,0.5))_border-box]">
        <div className="flex justify-center mb-6">
            <Logo />
        </div>
        <h2 className="text-center text-3xl font-bold text-brand-text-primary mb-2">Forgot Password?</h2>
        <p className="text-center text-brand-text-secondary mb-8">Enter your email to receive a reset link.</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              required
              className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-3 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-300
                         bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent)]"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-300
                      shadow-[0_0_20px_rgba(255,255,255,0.1)]
                      bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]"
          >
            Send Reset Link
          </button>
        </form>
         <p className="text-center text-sm text-brand-text-secondary mt-8">
            Remember your password?{' '}
            <button
                onClick={() => onNavigate('login')}
                className="font-medium text-brand-blue hover:underline focus:outline-none"
            >
                Sign in
            </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;