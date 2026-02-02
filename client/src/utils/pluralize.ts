/**
 * Utility function to properly pluralize like counts
 * @param count - The number of likes
 * @returns Properly pluralized string (e.g., "1 like", "2 likes")
 */
export const pluralizeLikes = (count: number): string => {
  return count === 1 ? "1 like" : `${count} likes`;
}; 