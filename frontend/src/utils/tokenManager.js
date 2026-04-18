import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Token Manager utility for handling JWT tokens
 * Provides methods for retrieving, refreshing, and validating tokens
 */

class TokenManager {
  constructor() {
    this.tokenRefreshInterval = null;
    this.TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes (tokens expire in 60 minutes)
  }

  /**
   * Get the current JWT token
   * @returns {Promise<string|null>} JWT token or null if not authenticated
   */
  async getToken() {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch (error) {
      console.error('Error fetching token:', error);
      return null;
    }
  }

  /**
   * Force refresh the JWT token
   * @returns {Promise<string|null>} New JWT token or null if refresh failed
   */
  async refreshToken() {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      return session.tokens?.idToken?.toString() || null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Get token expiration time
   * @returns {Promise<number|null>} Expiration timestamp or null
   */
  async getTokenExpiration() {
    try {
      const session = await fetchAuthSession();
      const expirationTime = session.tokens?.idToken?.payload?.exp;
      return expirationTime ? expirationTime * 1000 : null; // Convert to milliseconds
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  }

  /**
   * Check if token is expired or about to expire
   * @param {number} bufferMinutes - Minutes before expiration to consider token expired
   * @returns {Promise<boolean>} True if token is expired or about to expire
   */
  async isTokenExpired(bufferMinutes = 5) {
    try {
      const expirationTime = await this.getTokenExpiration();
      if (!expirationTime) return true;

      const bufferMs = bufferMinutes * 60 * 1000;
      const now = Date.now();
      
      return now >= (expirationTime - bufferMs);
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Start automatic token refresh
   * Refreshes token periodically to prevent expiration
   */
  startTokenRefresh() {
    if (this.tokenRefreshInterval) {
      this.stopTokenRefresh();
    }

    this.tokenRefreshInterval = setInterval(async () => {
      const isExpired = await this.isTokenExpired();
      if (isExpired) {
        await this.refreshToken();
      }
    }, this.TOKEN_REFRESH_INTERVAL);
  }

  /**
   * Stop automatic token refresh
   */
  stopTokenRefresh() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

  /**
   * Get user attributes from token
   * @returns {Promise<object|null>} User attributes or null
   */
  async getUserAttributes() {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.payload || null;
    } catch (error) {
      console.error('Error getting user attributes:', error);
      return null;
    }
  }

  /**
   * Get brand ID from custom attributes
   * @returns {Promise<string|null>} Brand ID or null
   */
  async getBrandId() {
    try {
      const attributes = await this.getUserAttributes();
      return attributes?.['custom:brand_id'] || null;
    } catch (error) {
      console.error('Error getting brand ID:', error);
      return null;
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();

// Export class for testing
export default TokenManager;
