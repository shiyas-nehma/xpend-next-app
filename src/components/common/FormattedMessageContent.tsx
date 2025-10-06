import React from 'react';

const FormattedMessageContent: React.FC<{ content: string }> = ({ content }) => {
  const regex = /(\*\*.*?\*\*|\$[0-9,]+(?:\.\d{2})?|\s\+\d+(?:\.\d+)?%|\s-\d+(?:\.\d+)?%)/g;
  const parts = content.split(regex).filter(Boolean);

  return (
    <div className="font-sans whitespace-pre-wrap leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-bold text-brand-text-primary">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('$')) {
          return <span key={index} className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-md font-semibold">{part}</span>;
        }
        if (part.trim().startsWith('+') && part.trim().endsWith('%')) {
          return <span key={index} className="bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-md font-semibold">{part.trim()}</span>;
        }
        if (part.trim().startsWith('-') && part.trim().endsWith('%')) {
          return <span key={index} className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-md font-semibold">{part.trim()}</span>;
        }
        return part;
      })}
    </div>
  );
};

export default FormattedMessageContent;
