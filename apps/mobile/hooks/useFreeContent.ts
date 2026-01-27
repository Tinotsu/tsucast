/**
 * Free Content Hook
 *
 * Fetches admin-curated free content that anyone can listen to without auth.
 */

import { useQuery } from '@tanstack/react-query';
import { getFreeContent } from '@/services/api';

export function useFreeContent() {
  return useQuery({
    queryKey: ['free-content'],
    queryFn: getFreeContent,
    staleTime: 5 * 60 * 1000, // 5 minutes — free content changes rarely
    select: (data) => data.items,
  });
}
