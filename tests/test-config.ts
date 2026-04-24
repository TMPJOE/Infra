/**
 * Test Configuration
 * Environment-specific configuration for the integration test suite
 */

export interface TestConfig {
  baseUrl: {
    apiGateway: string;
    userService: string;
    mediaService: string;
    hotelService: string;
    roomService: string;
  };
  credentials: {
    adminEmail: string;
    adminPassword: string;
    userEmail: string;
    userPassword: string;
  };
  timeouts: {
    request: number;
    serviceHealthy: number;
    betweenRequests: number;
  };
}

const config: TestConfig = {
  baseUrl: {
    apiGateway: process.env.API_GATEWAY_URL || 'http://localhost:8080',
    userService: process.env.USER_SERVICE_URL || 'http://localhost:8081',
    mediaService: process.env.MEDIA_SERVICE_URL || 'http://localhost:8082',
    hotelService: process.env.HOTEL_SERVICE_URL || 'http://localhost:8084',
    roomService: process.env.ROOM_SERVICE_URL || 'http://localhost:8085',
  },
  credentials: {
    adminEmail: process.env.ADMIN_EMAIL || 'admin@hotel.com',
    adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!',
    userEmail: process.env.USER_EMAIL || 'user@hotel.com',
    userPassword: process.env.USER_PASSWORD || 'User123!',
  },
  timeouts: {
    request: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
    serviceHealthy: parseInt(process.env.HEALTHY_TIMEOUT || '120000', 10),
    betweenRequests: parseInt(process.env.REQUEST_DELAY || '100', 10),
  },
};

export default config;
