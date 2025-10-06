'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Category } from '../../types';
import { XIcon, SparklesIcon } from '../icons/NavIcons';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<Category, 'id' | 'transactions' | 'amount'> & { id?: number }) => void;
  category: Category | null;
}

const EMOJIS = [
  '🛒', '🍔', '☕', '🏠', '💡', '💧', '🚗', '✈️', '🎁', '🎬', '👕', '💊',
  '💰', '💸', '📈', '💼', '💻', '📄', '🎓', '🏆', '🎉', '🐶', '🐱', '🔨'
];

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSave, category }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💡');
  const [type, setType] = useState<'Expense' | 'Income'>('Expense');
  const [budget, setBudget] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon);
      setType(category.type);
      setBudget(category.budget || 0);
      setDescription(category.description || '');
    } else {
      setName('');
      setIcon('💡');
      setType('Expense');
      setBudget(0);
      setDescription('');
    }
    setIsPickerOpen(false);
    setSuggestionError(null);
  }, [category, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
            setIsPickerOpen(false);
        }
    };

    if (isPickerOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPickerOpen]);

  const handleAISuggestions = async () => {
    if (!name) return;
    setIsSuggesting(true);
    setSuggestionError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the financial category name: "${name}". Suggest a single, most relevant emoji icon, classify the category type (must be 'Expense' or 'Income'), and write a short, one-sentence description for it.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              icon: {
                type: Type.STRING,
                description: 'A single emoji that represents the category.',
              },
              type: {
                type: Type.STRING,
                description: "The type of the category, must be either 'Expense' or 'Income'.",
              },
              description: {
                type: Type.STRING,
                description: 'A short, one-sentence description for this financial category.'
              }
            },
            required: ["icon", "type", "description"]
          },
        },
      });

      const result = JSON.parse(response.text);
      
      if (result.icon) {
        setIcon(result.icon);
      }
      if (result.type === 'Expense' || result.type === 'Income') {
        setType(result.type);
      }
      if (result.description) {
        setDescription(result.description);
      }
    } catch (error) {
      console.error("AI suggestion failed:", error);
      setSuggestionError("Sorry, AI suggestions are unavailable right now.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: category?.id,
      name,
      icon,
      type,
      budget,
      description,
    });
  };

  const handleIconSelect = (selectedIcon: string) => {
    setIcon(selectedIcon);
    setIsPickerOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-brand-surface rounded-2xl shadow-2xl p-8 z-10 
                   border border-transparent 
                   [background:linear-gradient(theme(colors.brand.surface),theme(colors.brand.surface))_padding-box,linear-gradient(120deg,theme(colors.brand.border),theme(colors.brand.border)_50%,rgba(93,120,255,0.5))_border-box]
                   relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_40%)] -z-10"></div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-brand-text-primary">{category ? 'Edit Category' : 'Add New Category'}</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
                <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="categoryName">
                    Category Name & Icon
                </label>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button
                        type="button"
                        onClick={() => setIsPickerOpen(!isPickerOpen)}
                        className="w-12 h-12 bg-brand-surface-2 border border-brand-border rounded-lg flex items-center justify-center text-3xl cursor-pointer hover:border-brand-blue transition-colors"
                        >
                        {icon}
                        </button>
                        {isPickerOpen && (
                        <div ref={pickerRef} className="absolute top-full mt-2 w-64 bg-brand-surface-2 border border-brand-border rounded-lg shadow-lg p-2 z-20 grid grid-cols-6 gap-2">
                            {EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => handleIconSelect(emoji)}
                                className="text-2xl p-1 rounded-md hover:bg-brand-border transition-colors"
                                aria-label={`Select emoji ${emoji}`}
                            >
                                {emoji}
                            </button>
                            ))}
                        </div>
                        )}
                    </div>
                    <div className="relative flex-1">
                        <input
                        type="text"
                        id="categoryName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g., Coffee, Salary"
                        className="w-full h-12 bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 pr-12 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                        <button 
                            type="button"
                            onClick={handleAISuggestions}
                            disabled={!name || isSuggesting}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand-yellow disabled:text-brand-text-secondary disabled:cursor-not-allowed transition-colors"
                            title="Get AI suggestions"
                        >
                            {isSuggesting ? (
                                <div className="w-5 h-5 border-2 border-brand-text-secondary border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <SparklesIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
                 {suggestionError && <p className="text-red-400 text-xs mt-2">{suggestionError}</p>}
            </div>

            <div>
              <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="categoryDescription">
                Description (Optional)
              </label>
              <textarea
                id="categoryDescription"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short note about this category..."
                className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="categoryType">
                        Category Type
                    </label>
                    <select 
                        id="categoryType"
                        value={type}
                        onChange={(e) => setType(e.target.value as 'Expense' | 'Income')}
                        className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 h-12 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                        <option value="Expense">Expense</option>
                        <option value="Income">Income</option>
                    </select>
                </div>
                <div>
                    <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="categoryBudget">
                        Monthly Budget (Optional)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary">$</span>
                        <input
                        type="number"
                        id="categoryBudget"
                        value={budget === 0 ? '' : budget}
                        onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full h-12 bg-brand-surface-2 border border-brand-border rounded-lg pl-7 pr-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                    </div>
                </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-brand-border flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-brand-surface-2 border border-brand-border text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-white text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors
                         shadow-[0_0_10px_rgba(255,255,255,0.1)]
                         bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]"
            >
              {category ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
