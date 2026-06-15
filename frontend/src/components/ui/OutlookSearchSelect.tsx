import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface OutlookSearchSelectProps<T> {
  label: string;
  placeholder?: string;
  initialItems: T[];
  searchApi: (search: string) => Promise<{ data: T[] }>;
  displayFn: (item: T) => string;
  chipDisplayFn: (item: T) => string;
  keyProp: keyof T;
  onChange: (selectedIds: number[], selectedItems: T[]) => void;
  disabled?: boolean;
  hideChips?: boolean;
}

export default function OutlookSearchSelect<T>({
  label,
  placeholder = 'Type to search...',
  initialItems,
  searchApi,
  displayFn,
  chipDisplayFn,
  keyProp,
  onChange,
  disabled = false,
  hideChips = false,
}: OutlookSearchSelectProps<T>) {
  const [selectedItems, setSelectedItems] = useState<T[]>(initialItems);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const searchApiRef = React.useRef(searchApi);
  useEffect(() => {
    searchApiRef.current = searchApi;
  }, [searchApi]);

  useEffect(() => {
    setSelectedItems(initialItems);
  }, [initialItems]);

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
    if (showSuggestions && !inputValue.trim()) {
      loadDefaultSuggestions();
    }
  }, [showSuggestions]);

  useEffect(() => {
    if (!inputValue.trim()) {
      if (showSuggestions) {
        loadDefaultSuggestions();
      } else {
        setSuggestions([]);
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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: T) => {
    const itemId = item[keyProp] as any;
    const exists = selectedItems.some((s) => (s[keyProp] as any) === itemId);
    if (!exists) {
      const updated = [...selectedItems, item];
      setSelectedItems(updated);
      onChange(updated.map((s) => s[keyProp] as any), updated);
    }
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleRemove = (item: T) => {
    const itemId = item[keyProp] as any;
    const updated = selectedItems.filter((s) => (s[keyProp] as any) !== itemId);
    setSelectedItems(updated);
    onChange(updated.map((s) => s[keyProp] as any), updated);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !inputValue && selectedItems.length > 0 && !hideChips) {
      handleRemove(selectedItems[selectedItems.length - 1]);
    } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else if (inputValue.trim()) {
        const trimmed = inputValue.trim();
        const newItem = {
          [keyProp]: trimmed,
        } as unknown as T;
        if (keyProp === 'department_id') {
          (newItem as any).department_code = trimmed;
          (newItem as any).department_name = trimmed;
        } else if (keyProp === 'segment_id') {
          (newItem as any).segment_code = trimmed;
          (newItem as any).segment_name = trimmed;
        } else if (keyProp === 'site_id') {
          (newItem as any).site_code = trimmed;
          (newItem as any).site_name = trimmed;
        } else if (keyProp === 'level_id') {
          (newItem as any).level_code = trimmed;
          (newItem as any).level_name = trimmed;
        } else if (keyProp === 'user_id') {
          (newItem as any).user_name = trimmed;
        }
        handleSelect(newItem);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      
      <div 
        onClick={() => inputRef.current?.focus()}
        className={`flex flex-wrap gap-1.5 p-1.5 border border-slate-300 rounded-lg bg-white min-h-[38px] cursor-text focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all ${
          disabled ? 'bg-slate-50 opacity-60 pointer-events-none' : ''
        }`}
      >
        {!hideChips && selectedItems.map((item) => (
          <span 
            key={item[keyProp] as any} 
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-md shadow-sm select-none max-w-full"
          >
            <span className="truncate">{chipDisplayFn(item)}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(item);
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-200"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        
        <div className="flex-1 min-w-[80px] flex items-center relative">
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
            placeholder={selectedItems.length === 0 ? placeholder : ''}
            className="w-full text-xs text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-none p-0.5"
          />
          {isLoading && (
            <Loader2 size={12} className="text-slate-400 animate-spin absolute right-2" />
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
            <div className="p-3 text-xs text-slate-400 text-center">
              No matches found
            </div>
          ) : (
            suggestions.map((item, idx) => (
              <div
                key={item[keyProp] as any}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`px-3 py-2 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                  idx === activeIndex ? 'bg-emerald-50 text-emerald-800 font-medium' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{displayFn(item)}</span>
                {selectedItems.some((s) => (s[keyProp] as any) === (item[keyProp] as any)) && (
                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">Selected</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
