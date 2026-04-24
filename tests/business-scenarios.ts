/**
 * Business Logic Test Scenarios
 * Advanced test scenarios that validate real-world business logic
 */

import config from './test-config.ts';
import { TestClient } from './test-client.ts';
import { TestRunner } from './test-runner.ts';
import * as assert from './assertions.ts';

const runner = new TestRunner(true);
const userClient = new TestClient(config.baseUrl.userService);
const hotelClient = new TestClient(config.baseUrl.hotelService);
const roomClient = new TestClient(config.baseUrl.roomService);

interface BusinessTestData {
  adminToken: string | null;
  userToken: string | null;
  hotelId: string | null;
  roomId: string | null;
  testUserId: string | null;
}

const testData: BusinessTestData = {
  adminToken: null,
  userToken: null,
  hotelId: null,
  roomId: null,
  testUserId: null,
};

/**
 * Scenario 1: Hotel Booking Flow
 * A user registers, browses hotels, checks room availability, and creates reviews
 */
async function testHotelBookingFlow(): Promise<void> {
  runner.startSuite('Business Scenario: Hotel Booking Flow');

  const uniqueId = Date.now();
  let userId: string | null = null;

  await runner.runTest('User registers for booking service', async () => {
    const response = await userClient.post('/register', {
      email: `traveler_${uniqueId}@example.com`,
      password: 'Traveler123!',
      displayName: 'Test Traveler',
      userType: 'user',
    });
    assert.assertHttpStatus(response.status, 201, 'Registration should succeed');
    userId = response.body.user?.id || null;
    testData.testUserId = userId;
  });

  await runner.runTest('User logs in to access booking features', async () => {
    const response = await userClient.post('/login', {
      email: `traveler_${uniqueId}@example.com`,
      password: 'Traveler123!',
    });
    assert.assertHttpStatus(response.status, 200, 'Login should succeed');
    assert.assertExists(response.body.access_token, 'Should receive access token');
    testData.userToken = response.body.access_token;
  });

  await runner.runTest('User browses available hotels', async () => {
    const response = await hotelClient.get('/hotels');
    assert.assertHttpStatus(response.status, 200, 'Should list hotels');
    assert.assert(Array.isArray(response.body), 'Response should be array');
  });

  await runner.runTest('User filters hotels by city', async () => {
    const response = await hotelClient.get('/hotels?city=Test');
    assert.assertHttpStatus(response.status, 200, 'Should filter by city');
  });

  runner.endSuite();
}

/**
 * Scenario 2: Admin Hotel Management Flow
 * An admin creates a hotel, adds rooms with media, and manages inventory
 */
async function testAdminHotelManagement(): Promise<void> {
  runner.startSuite('Business Scenario: Admin Hotel Management');

  const uniqueId = Date.now();

  await runner.runTest('Admin logs in to manage properties', async () => {
    const response = await userClient.post('/login', {
      email: `admin_${uniqueId}@hotel.com`,
      password: config.credentials.adminPassword,
    });

    if (response.status === 401) {
      const registerResponse = await userClient.post('/register', {
        email: `admin_${uniqueId}@hotel.com`,
        password: config.credentials.adminPassword,
        displayName: 'Test Admin',
        userType: 'admin',
      });
      assert.assertHttpStatus(registerResponse.status, 201, 'Admin registration should succeed');

      const loginResponse = await userClient.post('/login', {
        email: `admin_${uniqueId}@hotel.com`,
        password: config.credentials.adminPassword,
      });
      assert.assertHttpStatus(loginResponse.status, 200, 'Admin login should succeed');
      testData.adminToken = loginResponse.body.access_token;
    } else {
      assert.assertHttpStatus(response.status, 200, 'Admin login should succeed');
      testData.adminToken = response.body.access_token;
    }
  });

  await runner.runTest('Admin creates new hotel property', async () => {
    hotelClient.setToken(testData.adminToken!);
    const response = await hotelClient.post('/hotels', {
      name: `Business Test Hotel ${uniqueId}`,
      city: 'Business City',
      description: 'Hotel for business scenario testing',
      lat: 40.7128,
      lng: -74.0060,
    });
    assert.assertHttpStatus(response.status, 201, 'Hotel creation should succeed');
    assert.assertHasProperty(response.body, 'id', 'Should return hotel ID');
    testData.hotelId = response.body.id;
  });

  await runner.runTest('Admin creates rooms for the hotel', async () => {
    if (!testData.hotelId) throw new Error('No hotel ID');

    roomClient.setToken(testData.adminToken!);
    const response = await roomClient.post('/rooms', {
      hotel_id: testData.hotelId,
      room_type: 'Standard Room',
      capacity: 2,
      price_per_night: 150.00,
      available_quantity: 20,
      description: 'Standard room with basic amenities',
    });

    assert.assertHttpStatus(response.status, 201, 'Room creation should succeed');
    testData.roomId = response.body.id;
  });

  await runner.runTest('Admin updates room pricing', async () => {
    if (!testData.roomId) throw new Error('No room ID');

    roomClient.setToken(testData.adminToken!);
    const response = await roomClient.put(`/rooms/${testData.roomId}`, {
      price_per_night: 175.00,
    });

    assert.assertHttpStatus(response.status, 200, 'Room update should succeed');
  });

  await runner.runTest('Admin checks room inventory', async () => {
    if (!testData.roomId) throw new Error('No room ID');

    const response = await roomClient.get(`/rooms/${testData.roomId}`);
    assert.assertHttpStatus(response.status, 200, 'Should retrieve room');
    assert.assertExists(response.body.available_quantity, 'Should have quantity');
  });

  runner.endSuite();
}

/**
 * Scenario 3: Guest Review Flow
 * A guest stays at a hotel and leaves a review
 */
async function testGuestReviewFlow(): Promise<void> {
  runner.startSuite('Business Scenario: Guest Review Flow');

  const uniqueId = Date.now();
  let localHotelId: string | null = null;

  await runner.runTest('Guest creates account after stay', async () => {
    const response = await userClient.post('/register', {
      email: `guest_${uniqueId}@example.com`,
      password: 'Guest123!',
      displayName: 'Test Guest',
      userType: 'user',
    });
    assert.assertHttpStatus(response.status, 201, 'Guest registration should succeed');
  });

  await runner.runTest('Guest logs in to write review', async () => {
    const response = await userClient.post('/login', {
      email: `guest_${uniqueId}@example.com`,
      password: 'Guest123!',
    });
    assert.assertHttpStatus(response.status, 200, 'Guest login should succeed');
    testData.userToken = response.body.access_token;
  });

  await runner.runTest('Admin creates hotel for review test', async () => {
    await userClient.post('/login', {
      email: `admin_${uniqueId}@hotel.com`,
      password: config.credentials.adminPassword,
    });

    const response = await userClient.post('/login', {
      email: `admin_${uniqueId}@hotel.com`,
      password: config.credentials.adminPassword,
    });

    hotelClient.setToken(response.body.access_token);
    const createResponse = await hotelClient.post('/hotels', {
      name: `Review Test Hotel ${uniqueId}`,
      city: 'Review City',
      description: 'Hotel for review testing',
    });

    assert.assertHttpStatus(createResponse.status, 201, 'Hotel creation should succeed');
    localHotelId = createResponse.body.id;
  });

  await runner.runTest('Guest writes review for hotel', async () => {
    if (!localHotelId) throw new Error('No hotel ID');

    hotelClient.setToken(testData.userToken!);
    const response = await hotelClient.post(`/hotels/${localHotelId}/reviews`, {
      rating: 4,
      comment: 'Great stay, would recommend!',
    });

    assert.assertHttpStatus(response.status, 201, 'Review creation should succeed');
    assert.assertHasProperty(response.body, 'id', 'Should return review ID');
  });

  await runner.runTest('Guest views all reviews for hotel', async () => {
    if (!localHotelId) throw new Error('No hotel ID');

    const response = await hotelClient.get(`/hotels/${localHotelId}/reviews`);
    assert.assertHttpStatus(response.status, 200, 'Should retrieve reviews');
    assert.assert(Array.isArray(response.body), 'Reviews should be array');
    assert.assert(response.body.length > 0, 'Should have at least one review');
  });

  await runner.runTest('Hotel rating updates after review', async () => {
    if (!localHotelId) throw new Error('No hotel ID');

    const response = await hotelClient.get(`/hotels/${localHotelId}`);
    assert.assertHttpStatus(response.status, 200, 'Should retrieve hotel');
    assert.assertExists(response.body.rating, 'Hotel should have rating');
  });

  runner.endSuite();
}

/**
 * Scenario 4: Room Availability and Booking
 * Check room availability for specific dates
 */
async function testRoomAvailabilityFlow(): Promise<void> {
  runner.startSuite('Business Scenario: Room Availability');

  await runner.runTest('Check available rooms for date range', async () => {
    const response = await roomClient.get(
      '/rooms/available?check_in=2026-05-01&check_out=2026-05-05&guests=2'
    );
    assert.assertHttpStatus(response.status, 200, 'Availability check should succeed');
    assert.assert(Array.isArray(response.body), 'Response should be array');
  });

  await runner.runTest('Get all rooms for hotel', async () => {
    if (!testData.hotelId) {
      const hotelsResponse = await hotelClient.get('/hotels');
      if (hotelsResponse.body && hotelsResponse.body.length > 0) {
        testData.hotelId = hotelsResponse.body[0].id;
      }
    }

    if (testData.hotelId) {
      const response = await roomClient.get(`/hotels/${testData.hotelId}/rooms`);
      assert.assertHttpStatus(response.status, 200, 'Should list rooms');
    }
  });

  await runner.runTest('Get room details by ID', async () => {
    if (!testData.roomId) {
      console.log('    Skip: No room ID available');
      return;
    }

    const response = await roomClient.get(`/rooms/${testData.roomId}`);
    assert.assertHttpStatus(response.status, 200, 'Should retrieve room');
    assert.assertHasProperty(response.body, 'room_type', 'Should have room type');
    assert.assertHasProperty(response.body, 'price_per_night', 'Should have price');
  });

  runner.endSuite();
}

/**
 * Scenario 5: Media Asset Management
 * Test media upload and retrieval for hotels and rooms
 */
async function testMediaAssetFlow(): Promise<void> {
  runner.startSuite('Business Scenario: Media Asset Management');

  const mediaClient = new TestClient(config.baseUrl.mediaService);

  await runner.runTest('Media service health check', async () => {
    const response = await mediaClient.get('/health');
    assert.assertHttpStatus(response.status, 200, 'Media service should be healthy');
  });

  await runner.runTest('List media assets for hotel', async () => {
    if (!testData.hotelId) {
      console.log('    Skip: No hotel ID for media test');
      return;
    }

    const response = await mediaClient.get(`/hotels/${testData.hotelId}/images`);
    assert.assertHttpStatus(response.status, 200, 'Should list hotel images');
  });

  await runner.runTest('List media assets for room', async () => {
    if (!testData.roomId) {
      console.log('    Skip: No room ID for media test');
      return;
    }

    const response = await mediaClient.get(`/rooms/${testData.roomId}/images`);
    assert.assertHttpStatus(response.status, 200, 'Should list room images');
  });

  runner.endSuite();
}

/**
 * Scenario 6: Error Handling and Edge Cases
 */
async function testErrorHandling(): Promise<void> {
  runner.startSuite('Business Scenario: Error Handling');

  await runner.runTest('Get non-existent hotel returns 404', async () => {
    const response = await hotelClient.get('/hotels/non-existent-id');
    assert.assertHttpStatus(response.status, 404, 'Should return 404 for non-existent hotel');
  });

  await runner.runTest('Get non-existent room returns 404', async () => {
    const response = await roomClient.get('/rooms/non-existent-id');
    assert.assertHttpStatus(response.status, 404, 'Should return 404 for non-existent room');
  });

  await runner.runTest('Create hotel without auth returns 401', async () => {
    hotelClient.clearToken();
    const response = await hotelClient.post('/hotels', {
      name: 'Unauthorized Hotel',
      city: 'Test',
    });
    assert.assertHttpStatus(response.status, 401, 'Should return 401 without auth');
  });

  await runner.runTest('Create room without auth returns 401', async () => {
    roomClient.clearToken();
    const response = await roomClient.post('/rooms', {
      hotel_id: 'test-id',
      room_type: 'Test',
      capacity: 1,
      price_per_night: 100,
    });
    assert.assertHttpStatus(response.status, 401, 'Should return 401 without auth');
  });

  await runner.runTest('Invalid rating returns validation error', async () => {
    if (!testData.hotelId) {
      console.log('    Skip: No hotel ID for rating test');
      return;
    }

    hotelClient.setToken(testData.userToken || '');
    const response = await hotelClient.post(`/hotels/${testData.hotelId}/reviews`, {
      rating: 10,
      comment: 'Invalid rating test',
    });
    assert.assert(
      response.status === 400,
      'Should return 400 for invalid rating'
    );
  });

  runner.endSuite();
}

export async function runBusinessScenarios(): Promise<void> {
  await testHotelBookingFlow();
  await testAdminHotelManagement();
  await testGuestReviewFlow();
  await testRoomAvailabilityFlow();
  await testMediaAssetFlow();
  await testErrorHandling();
}

export { testData as businessTestData };
