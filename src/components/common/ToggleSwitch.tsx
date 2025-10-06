import React, { useState } from 'react';

interface ToggleSwitchProps {
  label: string;
  description: string;
  initialChecked?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, description, initialChecked = false }) => {
  const [isChecked, setIsChecked] = useState(initialChecked);

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-brand-text-primary">{label}</p>
        <p className="text-sm text-brand-text-secondary">{description}</p>
      </div>
      <button
        onClick={() => setIsChecked(!isChecked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-brand-surface
                    ${isChecked ? 'bg-brand-blue' : 'bg-brand-surface-2'}`}
        role="switch"
        aria-checked={isChecked}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${isChecked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
