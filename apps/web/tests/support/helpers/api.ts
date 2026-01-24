import { APIRequestContext } from "@playwright/test";

/**
 * API Helper for direct backend calls during E2E tests
 *
 * Use for:
 * - Test data setup (create users, articles)
 * - Cleanup after tests
 * - Verifying backend state
 */

const API_URL = process.env.API_URL || "http://localhost:3001/api";

interface ApiOptions {
  request: APIRequestContext;
  token?: string;
}

export class ApiHelper {
  private request: APIRequestContext;
  private token?: string;

  constructor({ request, token }: ApiOptions) {
    this.request = request;
    this.token = token;
  }

  private headers() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Check cache for a URL (useful for testing generation flow)
   */
  async checkCache(url: string) {
    const response = await this.request.post(`${API_URL}/cache/check`, {
      headers: this.headers(),
      data: { url },
    });
    return response.json();
  }

  /**
   * Get user's library items
   */
  async getLibrary() {
    const response = await this.request.get(`${API_URL}/library`, {
      headers: this.headers(),
    });
    return response.json();
  }

  /**
   * Delete a library item (cleanup)
   */
  async deleteLibraryItem(audioId: string) {
    const response = await this.request.delete(`${API_URL}/library/${audioId}`, {
      headers: this.headers(),
    });
    return response.ok();
  }
}
