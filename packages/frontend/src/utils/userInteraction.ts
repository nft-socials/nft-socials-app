/**
 * Utility functions to track user interactions with the dapp
 */

const INTERACTION_KEY = 'hasInteractedWithDapp';

/**
 * Mark that the user has interacted with the dapp
 */
export const markUserInteraction = () => {
  localStorage.setItem(INTERACTION_KEY, 'true');
};

/**
 * Check if the user has interacted with the dapp before
 */
export const hasUserInteracted = (): boolean => {
  return localStorage.getItem(INTERACTION_KEY) === 'true';
};

/**
 * Clear user interaction status (for testing purposes)
 */
export const clearUserInteraction = () => {
  localStorage.removeItem(INTERACTION_KEY);
};

/**
 * Track specific interaction types
 */
export const trackInteraction = (type: 'wallet_connect' | 'post_create' | 'post_like' | 'navigation' | 'marketplace_browse' | 'profile_view') => {
  markUserInteraction();
  
  // Optional: Track specific interaction types for analytics
  const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]');
  interactions.push({
    type,
    timestamp: Date.now()
  });
  localStorage.setItem('userInteractions', JSON.stringify(interactions));
};
