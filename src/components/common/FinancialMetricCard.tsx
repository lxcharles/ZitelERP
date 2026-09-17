import React from 'react';
import { LucideIcon } from 'lucide-react';

export type MetricColorVariant =
  | 'default'
  | 'emerald'
  | 'amber'
  | 'blue'
  | 'purple'
  | 'indigo'
  | 'rose'
  | 'slate';

export interface FinancialMetricBadge {
  text: React.ReactNode;
  variant?: MetricColorVariant;
  className?: string;
  icon?: LucideIcon;
}

export interface FinancialMetricCardProps {
  id?: string;
  title: React.ReactNode;
  value: React.ReactNode;
  icon?: LucideIcon;
  variant?: MetricColorVariant;
  headerBadge?: FinancialMetricBadge | React.ReactNode;
  badge?: FinancialMetricBadge | React.ReactNode;
  secondaryBadge?: FinancialMetricBadge | React.ReactNode;
  subtext?: React.ReactNode;
  subtextColor?: string;
  isMono?: boolean;
  prefix?: string;
  suffix?: string;
  progress?: {
    value: number;
    colorClass?: string;
    label?: string;
  };
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<
  MetricColorVariant,
  {
    iconBg: string;
    iconText: string;
    valueText: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  }
> = {
  default: {
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    valueText: 'text-slate-900',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    valueText: 'text-emerald-700',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200/80',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    valueText: 'text-amber-700',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200/80',
  },
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    valueText: 'text-slate-900',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200/80',
  },
  purple: {
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-600',
    valueText: 'text-slate-900',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200/80',
  },
  indigo: {
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-600',
    valueText: 'text-indigo-700',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200/80',
  },
  rose: {
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
    valueText: 'text-rose-700',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200/80',
  },
  slate: {
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    valueText: 'text-slate-900',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-200',
  },
};

export const FinancialMetricCard: React.FC<FinancialMetricCardProps> = ({
  id,
  title,
  value,
  icon: Icon,
  variant = 'default',
  headerBadge,
  badge,
  secondaryBadge,
  subtext,
  subtextColor,
  isMono = true,
  prefix,
  suffix,
  progress,
  onClick,
  className = '',
  children,
}) => {
  const styles = variantStyles[variant] || variantStyles.default;

  const renderBadge = (b: FinancialMetricBadge | React.ReactNode, keyPrefix = 'badge') => {
    if (!b) return null;
    if (React.isValidElement(b)) {
      return b;
    }
    if (typeof b === 'object' && 'text' in (b as FinancialMetricBadge)) {
      const badgeObj = b as FinancialMetricBadge;
      const bStyles = variantStyles[badgeObj.variant || variant] || styles;
      const BadgeIcon = badgeObj.icon;
      return (
        <span
          key={keyPrefix}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border max-w-full shrink-0 truncate ${bStyles.badgeBg} ${bStyles.badgeText} ${bStyles.badgeBorder} ${badgeObj.className || ''}`}
        >
          {BadgeIcon && <BadgeIcon className="w-3 h-3 shrink-0" />}
          <span className="truncate">{badgeObj.text}</span>
        </span>
      );
    }
    return (
      <span
        key={keyPrefix}
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border max-w-full shrink-0 truncate ${styles.badgeBg} ${styles.badgeText} ${styles.badgeBorder}`}
      >
        <span className="truncate">{b}</span>
      </span>
    );
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`min-w-0 w-full p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : ''
      } ${className}`}
    >
      <div className="min-w-0 w-full">
        {/* Top Header: Title, Optional Header Badge & Icon */}
        <div className="flex items-center justify-between gap-2 min-w-0 mb-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
            <span
              className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate block"
              title={typeof title === 'string' ? title : undefined}
            >
              {title}
            </span>
            {headerBadge && renderBadge(headerBadge, 'header-badge')}
          </div>
          {Icon && (
            <div
              className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${styles.iconBg} ${styles.iconText}`}
            >
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Value Section with strict responsive typography and bounds */}
        <div className="min-w-0">
          <div
            className={`text-xl sm:text-2xl font-black tracking-tight min-w-0 truncate break-words leading-tight ${styles.valueText} ${
              isMono ? 'font-mono' : ''
            }`}
            title={typeof value === 'string' || typeof value === 'number' ? `${prefix || ''}${value}${suffix || ''}` : undefined}
          >
            {prefix && <span className="opacity-80 text-[0.85em] mr-0.5">{prefix}</span>}
            {value}
            {suffix && <span className="opacity-80 text-[0.85em] ml-0.5">{suffix}</span>}
          </div>

          {/* Badges strip positioned under the value with clean flex wrapping and no overflow */}
          {(badge || secondaryBadge) && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap min-w-0 max-w-full">
              {badge && renderBadge(badge, 'primary-badge')}
              {secondaryBadge && renderBadge(secondaryBadge, 'secondary-badge')}
            </div>
          )}
        </div>

        {/* Optional Progress Bar */}
        {progress && (
          <div className="mt-3 min-w-0">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress.colorClass || 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }}
              />
            </div>
            {progress.label && (
              <span className="text-[10px] text-slate-400 font-medium mt-1 block truncate">
                {progress.label}
              </span>
            )}
          </div>
        )}

        {children}
      </div>

      {/* Footer Subtext with clean border separator and truncation */}
      {subtext && (
        <div
          className={`text-[11px] font-medium mt-3 pt-2.5 border-t border-slate-100/90 truncate min-w-0 ${
            subtextColor || 'text-slate-400'
          }`}
          title={typeof subtext === 'string' ? subtext : undefined}
        >
          {subtext}
        </div>
      )}
    </div>
  );
};
