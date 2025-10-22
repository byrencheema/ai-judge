const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }

  return response.json() as Promise<T>;
};

export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(url);
    return handleResponse<T>(response);
  },
  post: async <T>(url: string, body: unknown): Promise<T> => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return handleResponse<T>(response);
  },
  put: async <T>(url: string, body: unknown): Promise<T> => {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return handleResponse<T>(response);
  },
  delete: async (url: string): Promise<void> => {
    const response = await fetch(url, { method: "DELETE" });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || response.statusText);
    }
  }
};
