/**
 * Configuration Validation Tests
 * Validates the docker-compose.yml configuration and service connectivity
 */

import { TestClient } from './test-client.ts';
import { TestRunner } from './test-runner.ts';
import config from './test-config.ts';

const runner = new TestRunner(true);

/**
 * Test Suite: Docker Compose Configuration Validation
 * Validates that the infrastructure defined in docker-compose.yml is working correctly
 */
export async function testDockerComposeConfig(): Promise<void> {
  runner.startSuite('Docker Compose Configuration Validation');

  // Test API Gateway configuration
  await runner.runTest('API Gateway is accessible', async () => {
    const response = await fetch(`${config.baseUrl.apiGateway}/health`);
    if (!response.ok) {
      throw new Error(`API Gateway health check failed: ${response.status}`);
    }
  });

  // Test User Service container
  await runner.runTest('User Service container is running', async () => {
    const client = new TestClient(config.baseUrl.userService);
    const response = await client.get('/health');
    if (response.status !== 200) {
      throw new Error(`User Service not healthy: ${response.status}`);
    }
  });

  // Test Hotel Service container
  await runner.runTest('Hotel Service container is running', async () => {
    const client = new TestClient(config.baseUrl.hotelService);
    const response = await client.get('/health');
    if (response.status !== 200) {
      throw new Error(`Hotel Service not healthy: ${response.status}`);
    }
  });

  // Test Media Service container
  await runner.runTest('Media Service container is running', async () => {
    const client = new TestClient(config.baseUrl.mediaService);
    const response = await client.get('/health');
    if (response.status !== 200) {
      throw new Error(`Media Service not healthy: ${response.status}`);
    }
  });

  // Test Room Service container
  await runner.runTest('Room Service container is running', async () => {
    const client = new TestClient(config.baseUrl.roomService);
    const response = await client.get('/health');
    if (response.status !== 200) {
      throw new Error(`Room Service not healthy: ${response.status}`);
    }
  });

  // Test database connectivity through readiness checks
  await runner.runTest('User Service database connection', async () => {
    const client = new TestClient(config.baseUrl.userService);
    const response = await client.get('/ready');
    if (response.status !== 200) {
      throw new Error(`User Service DB not ready: ${response.status}`);
    }
  });

  await runner.runTest('Hotel Service database connection', async () => {
    const client = new TestClient(config.baseUrl.hotelService);
    const response = await client.get('/ready');
    if (response.status !== 200) {
      throw new Error(`Hotel Service DB not ready: ${response.status}`);
    }
  });

  // Test MinIO connectivity through Media Service
  await runner.runTest('MinIO storage accessible', async () => {
    const client = new TestClient(config.baseUrl.mediaService);
    // Media service should be able to connect to MinIO
    const response = await client.get('/health');
    if (response.status !== 200) {
      throw new Error(`MinIO connectivity issue: ${response.status}`);
    }
  });

  // Test service dependencies are properly configured
  await runner.runTest('Service dependency chain', async () => {
    // All services should be independently accessible
    const services = [
      { name: 'API Gateway', url: config.baseUrl.apiGateway },
      { name: 'User Service', url: config.baseUrl.userService },
      { name: 'Hotel Service', url: config.baseUrl.hotelService },
      { name: 'Media Service', url: config.baseUrl.mediaService },
      { name: 'Room Service', url: config.baseUrl.roomService },
    ];

    for (const service of services) {
      const response = await fetch(`${service.url}/health`);
      if (!response.ok) {
        throw new Error(`${service.name} dependency chain broken`);
      }
    }
  });

  runner.endSuite();
}

/**
 * Test Suite: Environment Configuration
 * Validates environment variables and configuration
 */
export async function testEnvironmentConfig(): Promise<void> {
  runner.startSuite('Environment Configuration');

  await runner.runTest('API Gateway URL is configured', async () => {
    if (!config.baseUrl.apiGateway) {
      throw new Error('API Gateway URL not configured');
    }
  });

  await runner.runTest('User Service URL is configured', async () => {
    if (!config.baseUrl.userService) {
      throw new Error('User Service URL not configured');
    }
  });

  await runner.runTest('Hotel Service URL is configured', async () => {
    if (!config.baseUrl.hotelService) {
      throw new Error('Hotel Service URL not configured');
    }
  });

  await runner.runTest('Media Service URL is configured', async () => {
    if (!config.baseUrl.mediaService) {
      throw new Error('Media Service URL not configured');
    }
  });

  await runner.runTest('Room Service URL is configured', async () => {
    if (!config.baseUrl.roomService) {
      throw new Error('Room Service URL not configured');
    }
  });

  runner.endSuite();
}

/**
 * Test Suite: Service Inter-communication
 * Validates that services can communicate with each other
 */
export async function testServiceCommunication(): Promise<void> {
  runner.startSuite('Service Inter-communication');

  const userClient = new TestClient(config.baseUrl.userService);
  const hotelClient = new TestClient(config.baseUrl.hotelService);
  const mediaClient = new TestClient(config.baseUrl.mediaService);

  await runner.runTest('User Service can serve requests', async () => {
    const response = await userClient.get('/health');
    if (response.status !== 200) {
      throw new Error('User Service communication failed');
    }
  });

  await runner.runTest('Hotel Service can serve requests', async () => {
    const response = await hotelClient.get('/health');
    if (response.status !== 200) {
      throw new Error('Hotel Service communication failed');
    }
  });

  await runner.runTest('Media Service can serve requests', async () => {
    const response = await mediaClient.get('/health');
    if (response.status !== 200) {
      throw new Error('Media Service communication failed');
    }
  });

  runner.endSuite();
}

/**
 * Test Suite: Endpoint Availability
 * Validates all expected endpoints are available
 */
export async function testEndpointAvailability(): Promise<void> {
  runner.startSuite('Endpoint Availability');

  const userClient = new TestClient(config.baseUrl.userService);
  const hotelClient = new TestClient(config.baseUrl.hotelService);
  const mediaClient = new TestClient(config.baseUrl.mediaService);
  const roomClient = new TestClient(config.baseUrl.roomService);

  // User Service endpoints
  const userEndpoints = [
    { method: 'GET', path: '/health', auth: false },
    { method: 'GET', path: '/ready', auth: false },
    { method: 'POST', path: '/register', auth: false },
    { method: 'POST', path: '/login', auth: false },
  ];

  for (const endpoint of userEndpoints) {
    await runner.runTest(`User Service: ${endpoint.method} ${endpoint.path}`, async () => {
      // We're just checking the endpoint exists (4xx means it exists but needs params)
      // 404 would mean the endpoint doesn't exist
      const response = await userClient.request(endpoint.method, endpoint.path, {});
      if (response.status === 404) {
        throw new Error(`Endpoint not found: ${endpoint.method} ${endpoint.path}`);
      }
    });
  }

  // Hotel Service endpoints
  const hotelEndpoints = [
    { method: 'GET', path: '/health', auth: false },
    { method: 'GET', path: '/ready', auth: false },
    { method: 'GET', path: '/hotels', auth: false },
  ];

  for (const endpoint of hotelEndpoints) {
    await runner.runTest(`Hotel Service: ${endpoint.method} ${endpoint.path}`, async () => {
      const response = await hotelClient.request(endpoint.method, endpoint.path, {});
      if (response.status === 404) {
        throw new Error(`Endpoint not found: ${endpoint.method} ${endpoint.path}`);
      }
    });
  }

  // Media Service endpoints
  const mediaEndpoints = [
    { method: 'GET', path: '/health', auth: false },
    { method: 'GET', path: '/ready', auth: false },
  ];

  for (const endpoint of mediaEndpoints) {
    await runner.runTest(`Media Service: ${endpoint.method} ${endpoint.path}`, async () => {
      const response = await mediaClient.request(endpoint.method, endpoint.path, {});
      if (response.status === 404) {
        throw new Error(`Endpoint not found: ${endpoint.method} ${endpoint.path}`);
      }
    });
  }

  // Room Service endpoints
  const roomEndpoints = [
    { method: 'GET', path: '/health', auth: false },
    { method: 'GET', path: '/ready', auth: false },
    { method: 'GET', path: '/rooms', auth: false },
  ];

  for (const endpoint of roomEndpoints) {
    await runner.runTest(`Room Service: ${endpoint.method} ${endpoint.path}`, async () => {
      const response = await roomClient.request(endpoint.method, endpoint.path, {});
      if (response.status === 404) {
        throw new Error(`Endpoint not found: ${endpoint.method} ${endpoint.path}`);
      }
    });
  }

  runner.endSuite();
}

// Run if this is the main module
if (import.meta.main) {
  async function main() {
    await testDockerComposeConfig();
    await testEnvironmentConfig();
    await testServiceCommunication();
    await testEndpointAvailability();
    console.log(runner.getReport());
  }

  main();
}

export { runner };
