import React from 'react';
import { LoginUser } from '../../../types';
import { NavigationTab } from '../../../types/navigation';

export interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  currentUser: LoginUser | null;
  hasExamSchedule: boolean;
  canAccessMonitorTools: boolean;
  isAdmin: boolean;
}

export interface SidebarNavButtonProps {
  isActive: boolean;
  activeClassName: string;
  onClick: () => void;
  children: React.ReactNode;
}
