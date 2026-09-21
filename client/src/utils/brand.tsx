import React from 'react';

/**
 * Renders the business name dynamically as a stylish 2-tone Apple-styled logo.
 * If the name has multiple words (e.g. "PC PART HUB" or "Apni Dukan"),
 * the last word is highlighted in accent blue (#0071e3).
 */
export function renderBrandLogo(name?: string) {
  const clean = (name || 'PC PART HUB').trim();
  const parts = clean.split(/\s+/);
  
  if (parts.length > 1) {
    const last = parts.pop();
    return (
      <span className="text-base font-bold tracking-tight text-[#1d1d1f]">
        {parts.join(' ')} <span className="text-[#0071e3]">{last}</span>
      </span>
    );
  }
  
  return (
    <span className="text-base font-bold tracking-tight text-[#1d1d1f]">
      {clean}
    </span>
  );
}
