/**
 * Health Check Script
 * Quick validation that all services are healthy before running full test suite
 */

import config from './test-config.ts';

const services = {
  'API Gateway': config.baseUrl.apiGateway,
  'User Service': config.baseUrl.userService,
  'Media Service': config.baseUrl.mediaService,
  'Hotel Service': config.baseUrl.hotelService,
  'Room Service': config.baseUrl.roomService,
  'Booking Service': config.baseUrl.bookingService,
  'BFF Service': config.baseUrl.bffService,
};

async function checkHealth(name: string, url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function checkReadiness(name: string, url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/ready`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     Service Health Check                                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  let allHealthy = true;

  for (const [name, url] of Object.entries(services)) {
    const health = await checkHealth(name, url);
    const readiness = await checkReadiness(name, url);
    const status = health && readiness ? '✓ HEALTHY' : '✗ UNHEALTHY';
    console.log(`${status} ${name.padEnd(20)} ${url}`);
    if (!health || !readiness) {
      allHealthy = false;
    }
  }

  console.log('\n');

  if (allHealthy) {
    console.log('All services are healthy and ready!\n');
    process.exit(0);
  } else {
    console.log('Some services are not healthy. Check docker-compose logs.\n');
    process.exit(1);
  }
}

main();
