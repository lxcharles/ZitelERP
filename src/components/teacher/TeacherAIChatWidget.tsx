import React from 'react';
import { AgentZEEChatWidget } from '../common/AgentZEEChatWidget';
import { User, ClassRoom } from '../../types';

export interface TeacherAIChatWidgetProps {
  currentUser: User;
  activeClass?: ClassRoom;
}

export const TeacherAIChatWidget: React.FC<TeacherAIChatWidgetProps> = ({ currentUser, activeClass }) => {
  return (
    <AgentZEEChatWidget
      currentUser={currentUser}
      activeTab="academics"
      activeClass={activeClass ? { id: activeClass.id, name: activeClass.name } : undefined}
    />
  );
};

export { AgentZEEChatWidget };
export default AgentZEEChatWidget;
