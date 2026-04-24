/**
 * Main Entry Point - Complete Integration Test Suite
 * 
 * This orchestrates all test suites including:
 * - Service health checks
 * - User authentication flows
 * - Hotel CRUD operations
 * - Media service integration
 * - Room service integration
 * - Review operations
 * - Cross-service data integrity
 * - Authorization and security
 * - Business logic scenarios
 * 
 * Usage:
 *   npm run test              - Run all tests
 *   npm run test:health       - Run health checks only
 *   npm run test:business     - Run business scenarios only
 *   npm run test:full         - Run with verbose output
 */

import config from './test-config.ts';
import { TestClient } from './test-client.ts';
import { TestRunner } from './test-runner.ts';
import { runBusinessScenarios } from './business-scenarios.ts';
import {
  testServiceHealth,
  testUserAuthentication,
  testHotelOperations,
  testMediaOperations,
  testRoomOperations,
  testReviewOperations,
  testDataIntegrity,
  testAuthorization,
  cleanupTestData,
  testData,
} from './main-test-suite.ts';
import {
  testDockerComposeConfig,
  testEnvironmentConfig,
  testServiceCommunication,
  testEndpointAvailability,
} from './config-validation.ts';

const runner = new TestRunner(true);

async function runAllTests(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     HOTEL MICROSERVICES                                  ║');
  console.log('║     End-to-End Integration Test Suite                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('Configuration:');
  console.log(`  API Gateway:    ${config.baseUrl.apiGateway}`);
  console.log(`  User Service:   ${config.baseUrl.userService}`);
  console.log(`  Hotel Service:  ${config.baseUrl.hotelService}`);
  console.log(`  Media Service:  ${config.baseUrl.mediaService}`);
  console.log(`  Room Service:   ${config.baseUrl.roomService}`);
  console.log('\n');

  const startTime = Date.now();

  try {
    // Phase 1: Configuration Validation
    console.log('Phase 1: Configuration Validation\n');
    await testDockerComposeConfig();
    await testEnvironmentConfig();
    await testServiceCommunication();
    await testEndpointAvailability();

    // Phase 2: Infrastructure Tests
    console.log('\nPhase 2: Infrastructure Tests\n');
    await testServiceHealth();

    // Phase 3: Core Functionality Tests
    console.log('\nPhase 3: Core Functionality Tests\n');
    await testUserAuthentication();
    await testHotelOperations();
    await testMediaOperations();
    await testRoomOperations();
    await testReviewOperations();

    // Phase 4: Integration Tests
    console.log('\nPhase 4: Integration Tests\n');
    await testDataIntegrity();
    await testAuthorization();

    // Phase 5: Business Logic Scenarios
    console.log('\nPhase 5: Business Logic Scenarios\n');
    await runBusinessScenarios();

    // Phase 6: Cleanup
    console.log('\nPhase 6: Cleanup\n');
    await cleanupTestData();

    // Final Report
    console.log(runner.getReport());

    const totalTime = Date.now() - startTime;
    console.log(`\nTotal execution time: ${totalTime}ms\n`);

    if (!runner.hasPassed()) {
      console.log('\n❌ Some tests failed. Check the report above for details.\n');
      process.exit(1);
    } else {
      console.log('\n✓ All tests passed successfully!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    console.log(runner.getReport());
    process.exit(1);
  }
}

runAllTests();
