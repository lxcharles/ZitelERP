import React from 'react';
import { User } from '../../types';
import { DashboardCalendarWidget } from './DashboardCalendarWidget';

export interface DailyCalendarIntelligenceWidgetProps {
  currentUser: User;
  onOpenFullCalendar?: () => void;
  compact?: boolean;
}

/**
 * DailyCalendarIntelligenceWidget
 * Simplified calendar widget for the Dashboard that aggregates upcoming school events
 * and teacher-set assessment deadlines.
 */
export const DailyCalendarIntelligenceWidget: React.FC<DailyCalendarIntelligenceWidgetProps> = ({
  currentUser,
  onOpenFullCalendar,
  compact = false,
}) => {
  return (
    <DashboardCalendarWidget
      currentUser={currentUser}
      onOpenFullCalendar={onOpenFullCalendar}
      compact={compact}
    />
  );
};

export { DashboardCalendarWidget };
