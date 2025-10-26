import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownMenuProps {
  topics: string[];
  placeholder?: string;
  onOpenChange?: (isOpen: boolean) => void;
  onTopicSelect?: (topic: string) => void;
  className?: string;
}

export default function DropdownMenu({ 
  topics, 
  placeholder = "Select Question Topic",
  onOpenChange,
  onTopicSelect,
  className = ""
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState); // Notify parent
  };
  
  const setClosed = () => {
    setIsOpen(false);
    onOpenChange?.(false); // Notify parent
  }; 

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setClosed();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (topic: string) => {
    setSelectedTopic(topic);
    onTopicSelect?.(topic); // Notify parent
    setClosed();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleOpen();
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative w-full max-w-md ${className}`}>
      <button
        type="button"
        onClick={() => toggleOpen()}
        onKeyDown={handleKeyDown}
        className="w-full px-6 py-4 bg-gradient-to-r from-pretty-blue to-pretty-purple rounded-2xl 
                   text-left text-gray-700 font-bold text-2xl shadow-lg 
                   hover:from-purple-350 hover:to-blue-350 
                   focus:outline-none focus:ring-2 focus:ring-purple-outline focus:ring-5
                   transition-all duration-200 ease-in-out
                   flex items-center justify-between group"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedTopic ? "text-text-field" : "text-text-field"}>
          {selectedTopic || placeholder}
        </span>
        <ChevronDown 
          className={`w-6 h-6 text-gray-600 transition-transform duration-200 
                     ${isOpen ? 'rotate-180' : 'rotate-0'}
                     group-hover:text-text-field`}
        />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl 
                     border border-gray-100 overflow-hidden z-50
                     animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
        >
          <div className="max-h-60 overflow-y-auto">
            {topics.map((topic, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(topic)}
                className="w-full px-6 py-3 text-left text-gray-700 font-semibold text-xl hover:bg-gray-100 
                           focus:bg-gray-50 focus:outline-none transition-colors duration-150
                           first:pt-4 last:pb-4 text-base"
                role="option"
                aria-selected={selectedTopic === topic}
              >
                <span className={selectedTopic === topic ? "font-semibold text-logo-purple" : ""}>
                  {topic}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}