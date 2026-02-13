
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, useEffect } from 'react';

export const useBackendHealth = () => {
  const [showHealthError, setShowHealthError] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', {
        method: 'POST',
      });

      if (!response.ok) {
        setShowHealthError(true);
        setIsHealthy(false);
        return false;
      }

      const data = await response.json();
      if (data.status === 'ok') {
        setIsHealthy(true);
        setShowHealthError(false);
        return true;
      }

      setShowHealthError(true);
      setIsHealthy(false);
      return false;
    } catch (error) {
      console.warn('Backend health check failed', error);
      setShowHealthError(true);
      setIsHealthy(false);
      return false;
    }
  }, []);

  const handleErrorDismiss = useCallback(() => {
    setShowHealthError(false);
  }, []);

  // Auto-check health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    showHealthError,
    isHealthy,
    checkHealth,
    handleErrorDismiss,
  };
};
