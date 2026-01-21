/**
 * Toast Hook
 *
 * Provides convenient methods for showing toast notifications.
 * Story: 6-1 Error Handling & User Feedback
 */

import Toast from 'react-native-toast-message';

export function useToast() {
  /**
   * Show a success toast
   */
  const showSuccess = (title: string, message?: string) => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      visibilityTime: 3000,
      position: 'top',
    });
  };

  /**
   * Show an error toast
   */
  const showError = (title: string, message?: string) => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      visibilityTime: 4000,
      position: 'top',
    });
  };

  /**
   * Show an info toast
   */
  const showInfo = (title: string, message?: string) => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      visibilityTime: 3000,
      position: 'top',
    });
  };

  /**
   * Show a network error toast
   */
  const showNetworkError = () => {
    Toast.show({
      type: 'network',
      text1: 'No internet connection',
      text2: 'Please check your connection and try again',
      visibilityTime: 4000,
      position: 'top',
    });
  };

  /**
   * Show a generation error toast
   */
  const showGenerationError = () => {
    showError(
      'Audio generation failed',
      'Please try again or try a different article'
    );
  };

  /**
   * Show a rate limit error toast
   */
  const showRateLimitError = (resetIn?: string) => {
    showInfo(
      "You've reached your daily limit",
      resetIn ? `Try again ${resetIn}` : 'Upgrade for unlimited access'
    );
  };

  /**
   * Show a timeout error toast
   */
  const showTimeoutError = () => {
    showError(
      'Request timed out',
      'This is taking too long. Please try again.'
    );
  };

  /**
   * Hide all toasts
   */
  const hide = () => {
    Toast.hide();
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showNetworkError,
    showGenerationError,
    showRateLimitError,
    showTimeoutError,
    hide,
  };
}
