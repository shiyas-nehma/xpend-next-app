import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    const feedback = [];
    
    if (pwd.length >= 6) score++;
    else feedback.push('At least 6 characters');
    
    if (/[A-Z]/.test(pwd)) score++;
    else feedback.push('One uppercase letter');
    
    if (/[a-z]/.test(pwd)) score++;
    else feedback.push('One lowercase letter');
    
    if (/[0-9]/.test(pwd)) score++;
    else feedback.push('One number');
    
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    else feedback.push('One special character');
    
    return { score, feedback };
  };
  
  if (!password) return null;
  
  const { score, feedback } = getPasswordStrength(password);
  
  const getStrengthColor = () => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };
  
  const getStrengthText = () => {
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };
  
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${
          score <= 2 ? 'text-red-400' :
          score <= 3 ? 'text-yellow-400' :
          score <= 4 ? 'text-blue-400' : 'text-green-400'
        }`}>
          {getStrengthText()}
        </span>
      </div>
      
      {feedback.length > 0 && (
        <div className="text-xs text-gray-400">
          <span>Password should include: </span>
          <span>{feedback.join(', ')}</span>
        </div>
      )}
    </div>
  );
};

export default PasswordStrength;