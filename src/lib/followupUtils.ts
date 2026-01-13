import { isBefore, isToday, startOfToday } from 'date-fns';
import { BadgeProps } from "@/components/ui/badge";

type FollowUpStatus = {
  text: string;
  variant: BadgeProps["variant"];
  className: string;
};

export const getFollowUpStatus = (followUpDate: string | null | undefined): FollowUpStatus | null => {
  if (!followUpDate) {
    return null;
  }

  const today = startOfToday();
  const date = new Date(followUpDate);

  if (isBefore(date, today)) {
    return {
      text: 'Atrasado',
      variant: 'destructive',
      className: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
  }

  if (isToday(date)) {
    return {
      text: 'Hoje',
      variant: 'default',
      className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };
  }

  return {
    text: 'Futuro',
    variant: 'secondary',
    className: 'bg-green-500/20 text-green-300 border-green-500/30',
  };
};