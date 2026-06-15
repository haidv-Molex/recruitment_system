import React, { useEffect, useState, useRef } from 'react';
import { X, Loader2, ChevronDown } from 'lucide-react';

interface SingleSearchSelectProps<T> {
  label: string;
  placeholder?: string;
  initialItem: T | null;
  searchApi: (search: string) => Promise<{ data: T[] }>;
  displayFn: (item: T) => string;
  keyProp: keyof T;
  onChange: (selectedId: any, selectedItem: T | null) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function SingleSearchSelect<T>({
  label,
  placeholder = 'Type to search...',
  initialItem,
  searchApi,
  displayFn,
  keyProp,
  onChange,
  disabled = false,
  required = false,
}: SingleSearchSelectProps<T>) {
  const [selectedItem, setSelectedItem] = useState<T | null>(initialItem);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchApiRef = useRef(searchApi);
  useEffect(() => {
    searchApiRef.current = searchApi;
  }, [searchApi]);

  useEffect(() => {
    setSelectedItem(initialItem);
    if (initialItem) {
      setInputValue(displayFn(initialItem));
    } else {
      setInputValue('');
    }
  }, [initialItem]);

  const loadDefaultSuggestions = async () => {
    setIsLoading(true);
    try {
      const res = await searchApiRef.current('');
      setSuggestions((res.data || []).slice(0, 5));
      setActiveIndex(-1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showSuggestions && !inputValue.trim() && !selectedItem) {
      loadDefaultSuggestions();
    }
  }, [showSuggestions]);

  useEffect(() => {
    if (selectedItem && inputValue === displayFn(selectedItem)) {
      return; // Already matched
    }

    if (!inputValue.trim()) {
      setSuggestions([]);
      if (selectedItem) {
        setSelectedItem(null);
        onChange(null, null);
      }
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(async () => {
      try {
        const res = await searchApiRef.current(inputValue);
        const data = (res.data || []).slice(0, 5);
        setSuggestions(data);
        setActiveIndex(-1);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [inputValue]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        // Restore input value if click outside without selecting
        if (selectedItem) {
          setInputValue(displayFn(selectedItem));
        } else {
          setInputValue('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedItem]);

  const handleSelect = (item: T) => {
    setSelectedItem(item);
    setInputValue(displayFn(item));
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    onChange(item[keyProp], item);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(null);
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    onChange(null, null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      if (selectedItem) {
        setInputValue(displayFn(selectedItem));
      } else {
        setInputValue('');
      }
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      <label className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-8 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all disabled:bg-slate-50 disabled:text-slate-400 text-slate-900 ${
            disabled ? 'opacity-60 pointer-events-none' : ''
          }`}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 size={14} className="text-slate-400 animate-spin" />}
          {selectedItem && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100"
            >
              <X size={14} />
            </button>
          ) : (
            <ChevronDown size={14} className="text-slate-400" />
          )}
        </div>
      </div>

      {showSuggestions && (inputValue.trim() || suggestions.length > 0) && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-[9999] max-h-[200px] overflow-y-auto py-1 divide-y divide-slate-100">
          {isLoading && suggestions.length === 0 ? (
            <div className="flex items-center justify-center p-3 text-xs text-slate-400 gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              <span>Searching...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-xs text-slate-400 text-center">No matches found</div>
          ) : (
            suggestions.map((item, idx) => (
              <div
                key={item[keyProp] as any}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`px-3 py-2 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                  idx === activeIndex
                    ? 'bg-emerald-50 text-emerald-800 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{displayFn(item)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
