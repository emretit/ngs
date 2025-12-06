import { useTabNavigation } from '@/hooks/useTabNavigation';

// This component handles tab navigation without rendering anything
export default function TabNavigationHandler() {
  useTabNavigation();
  return null;
}
