/**
 * Test Client
 * HTTP client wrapper for making requests to microservices
 */

import config from "./test-config.ts";

export interface HttpResponse<T = any> {
	status: number;
	headers: Headers;
	body: T;
	ok: boolean;
}

export class TestClient {
	private baseURL: string;
	private defaultHeaders: Record<string, string>;
	private token: string | null = null;

	constructor(baseURL: string, defaultHeaders: Record<string, string> = {}) {
		this.baseURL = baseURL;
		this.defaultHeaders = {
			"Content-Type": "application/json",
			...defaultHeaders,
		};
	}

	setToken(token: string) {
		this.token = token;
	}

	clearToken() {
		this.token = null;
	}

	private getHeaders(
		customHeaders: Record<string, string> = {},
	): Record<string, string> {
		const headers: Record<string, string> = {
			...this.defaultHeaders,
			...customHeaders,
		};
		if (this.token) {
			headers["Authorization"] = `Bearer ${this.token}`;
		}
		return headers;
	}

	async request<T = any>(
		method: string,
		path: string,
		options: {
			body?: any;
			headers?: Record<string, string>;
			isMultipart?: boolean;
		} = {},
	): Promise<HttpResponse<T>> {
		const url = `${this.baseURL}${path}`;
		const headers = this.getHeaders(options.headers);

		let body: any;
		if (options.isMultipart && options.body) {
			body = options.body;
			delete headers["Content-Type"];
		} else if (options.body) {
			body = JSON.stringify(options.body);
		}

		const response = await fetch(url, {
			method,
			headers,
			body,
		});

    let responseBody: any;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const text = await response.text();
      responseBody = text ? JSON.parse(text) : {};
    } else {
      responseBody = await response.text();
    }

		return {
			status: response.status,
			headers: response.headers,
			body: responseBody as T,
			ok: response.ok,
		};
	}

	async get<T = any>(
		path: string,
		headers?: Record<string, string>,
	): Promise<HttpResponse<T>> {
		return this.request<T>("GET", path, { headers });
	}

	async post<T = any>(
		path: string,
		body?: any,
		headers?: Record<string, string>,
	): Promise<HttpResponse<T>> {
		return this.request<T>("POST", path, { body, headers });
	}

	async put<T = any>(
		path: string,
		body?: any,
		headers?: Record<string, string>,
	): Promise<HttpResponse<T>> {
		return this.request<T>("PUT", path, { body, headers });
	}

	async delete<T = any>(
		path: string,
		headers?: Record<string, string>,
	): Promise<HttpResponse<T>> {
		return this.request<T>("DELETE", path, { headers });
	}

	async patch<T = any>(
		path: string,
		body?: any,
		headers?: Record<string, string>,
	): Promise<HttpResponse<T>> {
		return this.request<T>("PATCH", path, { body, headers });
	}
}

export const createClient = (
	serviceKey: keyof typeof config.baseUrl,
): TestClient => {
	const url = config.baseUrl[serviceKey] || config.baseUrl.apiGateway;
	return new TestClient(url);
};
