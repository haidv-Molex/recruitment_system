import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
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
  compact?: boolean;
  allowCreation?: boolean;
  commitOnBlur?: boolean;
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
  compact = false,
  allowCreation = false,
  commitOnBlur = false,
}: SingleSearchSelectProps<T>) {
  const [selectedItem, setSelectedItem] = useState<T | null>(initialItem);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
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

  // Recompute dropdown position when it opens or on scroll/resize
  useEffect(() => {
    if (!showSuggestions) {
      setDropdownPos(null);
      return;
    }
    const update = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [showSuggestions]);

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
      return;
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

  const createItemFromInput = (value: string) => {
    const newItem = { [keyProp]: value } as unknown as T;
    if (keyProp === 'user_id') {
      (newItem as any).user_name = value;
    } else if (keyProp === 'department_id') {
      (newItem as any).department_code = value;
      (newItem as any).department_name = value;
    }
    return newItem;
  };

  const handleSelect = (item: T) => {
    setSelectedItem(item);
    setInputValue(displayFn(item));
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    onChange(item[keyProp], item);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const portal = document.getElementById('sss-portal-root');
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(portal && portal.contains(target))
      ) {
        setShowSuggestions(false);
        if (commitOnBlur && allowCreation && inputValue.trim()) {
          const trimmed = inputValue.trim();
          const exactSuggestion = suggestions.find(
            (s) => displayFn(s).toLowerCase() === trimmed.toLowerCase()
          );
          handleSelect(exactSuggestion || createItemFromInput(trimmed));
          return;
        }
        if (selectedItem) {
          setInputValue(displayFn(selectedItem));
        } else {
          setInputValue('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedItem, inputValue, suggestions, allowCreation, commitOnBlur]);

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
      } else if (allowCreation && inputValue.trim()) {
        const trimmed = inputValue.trim();
        handleSelect(createItemFromInput(trimmed));
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

  const dropdownContent =
    showSuggestions && dropdownPos && (inputValue.trim() || suggestions.length > 0)
      ? ReactDOM.createPortal(
          <div
            id="sss-portal-root"
            style={{
              position: 'fixed',
              top: dropdownPos.top - window.scrollY,
              left: dropdownPos.left - window.scrollX,
              width: dropdownPos.width,
              zIndex: 99999,
            }}
            className="bg-white border border-slate-200 rounded-lg shadow-xl max-h-[200px] overflow-y-auto py-1 divide-y divide-slate-100"
          >
            {isLoading && suggestions.length === 0 ? (
              <div className="flex items-center justify-center p-3 text-xs text-slate-400 gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                <span>Searching...</span>
              </div>
            ) : (
              <>
                {suggestions.map((item, idx) => (
                  <div
                    key={item[keyProp] as any}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`px-3 py-2 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      idx === activeIndex
                        ? 'bg-emerald-50 text-emerald-800 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{displayFn(item)}</span>
                  </div>
                ))}
                {allowCreation &&
                  inputValue.trim() &&
                  !suggestions.some(
                    (s) => displayFn(s).toLowerCase() === inputValue.trim().toLowerCase()
                  ) && (
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const trimmed = inputValue.trim();
                        handleSelect(createItemFromInput(trimmed));
                      }}
                      className="px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50 cursor-pointer font-semibold transition-colors"
                    >
                      + Create "{inputValue.trim()}"
                    </div>
                  )}
              </>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

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
          className={
            compact
              ? `w-full px-2 py-1 pr-6 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all disabled:bg-slate-50 disabled:text-slate-400 text-slate-900 ${
                  disabled ? 'opacity-60 pointer-events-none' : ''
                }`
              : `w-full px-3 py-2 pr-8 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all disabled:bg-slate-50 disabled:text-slate-400 text-slate-900 ${
                  disabled ? 'opacity-60 pointer-events-none' : ''
                }`
          }
        />
        <div
          className={
            compact
              ? 'absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5'
              : 'absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1'
          }
        >
          {isLoading && <Loader2 size={compact ? 12 : 14} className="text-slate-400 animate-spin" />}
          {selectedItem && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100"
            >
              <X size={compact ? 12 : 14} />
            </button>
          ) : (
            <ChevronDown size={compact ? 12 : 14} className="text-slate-400" />
          )}
        </div>
      </div>

      {dropdownContent}
    </div>
  );
}
