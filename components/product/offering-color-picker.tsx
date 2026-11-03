'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import CategoryLabel from './category-label';
import { isOfferingTone, offeringPalette, offeringTones, type OfferingTone } from '../../domain/offering-colors';

export default function OfferingColorPicker({ initial, suggested }: { initial?: string; suggested: OfferingTone }) {
  const [choice, setChoice] = useState(() => isOfferingTone(initial) ? initial : suggested);
  return (
    <fieldset className="offering-color-picker">
      <legend>Calendar color</legend>
      <p>Pick a color for this offering and all of its calendar sessions.</p>
      <input type="hidden" name="calendarColor" value={choice} />
      <div className="offering-color-options">
        {offeringTones.map(tone => (
          <button key={tone} type="button" aria-pressed={choice === tone} onClick={() => setChoice(tone)}>
            <span className="offering-swatch" style={{ backgroundColor: offeringPalette[tone].swatch }} aria-hidden="true" />
            <span>{offeringPalette[tone].name}</span>
            {choice === tone && <Check size={14} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="offering-color-preview" aria-live="polite">
        <small>Calendar preview</small>
        <CategoryLabel kind="offering" value="custom" tone={choice}>{offeringPalette[choice].name}</CategoryLabel>
      </div>
    </fieldset>
  );
}
