'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/libs/cn';

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showActiveState?: boolean;
}

export function CustomDropdown({
  value,
  options,
  onChange,
  placeholder = "Select option",
  className,
  showActiveState = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 120),
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on scroll (but not when scrolling inside the dropdown)
  useEffect(() => {
    if (!isOpen) return;

    function handleScroll(event: Event) {
      // Don't close if scrolling inside the dropdown
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    }

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption?.label || placeholder;
  const hasSelection = Boolean(value && selectedOption);

  // Prevent scroll propagation from dropdown
  const handleDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handleDropdownWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center rounded-lg border px-2 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap gap-1',
          showActiveState && hasSelection
            ? 'bg-white/20 text-white border-white/40'
            : 'bg-black/30 text-white/80 border-white/20 hover:bg-white/10'
        )}
      >
        <span>{displayValue}</span>
        <ChevronDown
          className={cn(
            'w-3 h-3 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-black border border-white/20 rounded-lg shadow-xl backdrop-blur-sm max-w-[200px]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: Math.min(dropdownPosition.width, 200),
            zIndex: 99999,
          }}
          onScroll={handleDropdownScroll}
          onWheel={handleDropdownWheel}
        >
          <div className="py-1 max-h-48 overflow-y-auto scrollbar-hide">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 transition-colors truncate',
                  value === option.value ? 'bg-white/20 text-white' : 'text-white/80'
                )}
                title={option.label}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Convenience component for version dropdown
interface VersionDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function VersionDropdown({
  value,
  options,
  onChange,
  placeholder = "All Versions",
  className,
}: VersionDropdownProps) {
  // Truncate long version strings for display
  const truncateVersion = (version: string): string => {
    if (version.length > 12) {
      return version.substring(0, 10) + '...';
    }
    return version;
  };

  const dropdownOptions: DropdownOption[] = [
    { value: '', label: placeholder },
    ...options.map(version => ({ value: version, label: `v${truncateVersion(version)}` }))
  ];

  return (
    <CustomDropdown
      value={value}
      options={dropdownOptions}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      showActiveState={true}
    />
  );
}