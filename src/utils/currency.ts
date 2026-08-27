import { db } from '../services/db';
import { SchoolProfile } from '../types';

/**
 * Format any numerical currency amount dynamically according to active school profile
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  customProfile?: Partial<SchoolProfile>
): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  
  let symbol = '₦';
  let position: 'prefix' | 'suffix' = 'prefix';

  try {
    const profile = customProfile || db.getSchoolProfile();
    if (profile && profile.currencySymbol) {
      symbol = profile.currencySymbol;
    }
    if (profile && profile.currencyPosition) {
      position = profile.currencyPosition;
    }
  } catch {
    // Fallback default
    symbol = '₦';
  }

  const formattedNumber = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  if (position === 'suffix') {
    return `${formattedNumber} ${symbol}`;
  }
  return `${symbol}${formattedNumber}`;
}

export function getSchoolCurrencySymbol(): string {
  try {
    const profile = db.getSchoolProfile();
    return profile?.currencySymbol || '₦';
  } catch {
    return '₦';
  }
}

export function getSchoolCurrencyCode(): string {
  try {
    const profile = db.getSchoolProfile();
    return profile?.currency || 'NAIRA';
  } catch {
    return 'NAIRA';
  }
}
