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
const bookingClient = new TestClient(config.baseUrl.bookingService);
const bffClient = new TestClient(config.baseUrl.bffService);

interface BusinessTestData {
  adminToken: string | null;
  userToken: string | null;
  hotelId: string | null;
  roomId: string | null;
  testUserId: string | null;
  bookingId: string | null;
}

const testData: BusinessTestData = {
  adminToken: null,
  userToken: null,
  hotelId: null,
  roomId: null,
  testUserId: null,
  bookingId: null,
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
* Scenario 6: Complete Booking Flow via BFF
* Tests the reservation creation through BFF which coordinates with hotel, room, and booking services
* Note: BFF does NOT handle auth - uses User Service directly
* BFF uses /reservations not /bookings
*/
async function testBookingFlowViaBFF(): Promise<void> {
  runner.startSuite('Business Scenario: Complete Booking Flow via BFF');

  const uniqueId = Date.now();

  // Step 1: Create user and login through User Service (BFF doesn't have auth)
  await runner.runTest('User registers for booking test', async () => {
    const response = await userClient.post('/register', {
      email: `booking_user_${uniqueId}@example.com`,
      password: 'Booking123!',
      displayName: 'Booking Test User',
      userType: 'user',
    });
    assert.assertHttpStatus(response.status, 201, 'Registration should succeed');
  });

  await runner.runTest('User logs in for booking test', async () => {
    const response = await userClient.post('/login', {
      email: `booking_user_${uniqueId}@example.com`,
      password: 'Booking123!',
    });
    assert.assertHttpStatus(response.status, 200, 'Login should succeed');
    assert.assertExists(response.body.access_token, 'Should receive access token');
    testData.userToken = response.body.access_token;
    testData.testUserId = response.body.user?.id;
    bffClient.setToken(testData.userToken!);
  });

  // Step 2: Create hotel (admin) - through Hotel Service, then use BFF for room creation
  await runner.runTest('Admin creates hotel for booking test', async () => {
    // Login admin through User Service
    const loginResponse = await userClient.post('/login', {
      email: config.credentials.adminEmail,
      password: config.credentials.adminPassword,
    });

    if (loginResponse.status === 401) {
      // Register admin first
      const registerResponse = await userClient.post('/register', {
        email: config.credentials.adminEmail,
        password: config.credentials.adminPassword,
        displayName: 'Test Admin',
        userType: 'admin',
      });
      assert.assertHttpStatus(registerResponse.status, 201, 'Admin registration should succeed');
    }

    const adminLogin = await userClient.post('/login', {
      email: config.credentials.adminEmail,
      password: config.credentials.adminPassword,
    });
    assert.assertHttpStatus(adminLogin.status, 200, 'Admin login should succeed');
    testData.adminToken = adminLogin.body.access_token;

    // Create hotel through Hotel Service directly
    hotelClient.setToken(testData.adminToken!);
    const response = await hotelClient.post('/hotels', {
      name: `Booking Test Hotel ${uniqueId}`,
      city: 'Booking City',
      description: 'Hotel for booking flow testing',
      lat: 40.7128,
      lng: -74.0060,
    });
    assert.assertHttpStatus(response.status, 201, 'Hotel creation should succeed');
    testData.hotelId = response.body.id;
  });

  await runner.runTest('Admin creates room via BFF bridge', async () => {
    if (!testData.hotelId) throw new Error('No hotel ID');

    bffClient.setToken(testData.adminToken!);
    // BFF POST /hotels/{hotelId}/rooms validates hotel exists first, then forwards to Room Service
    const response = await bffClient.post(`/hotels/${testData.hotelId}/rooms`, {
      hotel_id: testData.hotelId,
      room_type: 'Deluxe Suite',
      capacity: 2,
      price_per_night: 200.00,
      available_quantity: 10,
      description: 'Deluxe suite for booking tests',
    });
    assert.assertHttpStatus(response.status, 201, 'Room creation via BFF should succeed');
    testData.roomId = response.body.id;
  });

  // Step 3: Check room availability via BFF
  await runner.runTest('Check room availability before booking via BFF', async () => {
    if (!testData.roomId) throw new Error('No room ID');

    bffClient.setToken(testData.userToken!);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 10);

    // Note: BFF does not expose /rooms/{roomId}/availability directly
    // We check via the room detail endpoint or create reservation which validates
    const response = await bffClient.get(`/rooms/${testData.roomId}`);
    assert.assertHttpStatus(response.status, 200, 'Should retrieve room');
    assert.assertHasProperty(response.body, 'id', 'Room should have ID');
  });

  // Step 4: Create reservation via BFF (bridge pattern)
  await runner.runTest('User creates a reservation via BFF', async () => {
    if (!testData.hotelId || !testData.roomId) {
      throw new Error('Missing required IDs');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 10);

    // BFF POST /reservations validates hotel + room exist, calculates total, then forwards
    const response = await bffClient.post('/reservations', {
      hotel_id: testData.hotelId,
      room_id: testData.roomId,
      check_in: startDate.toISOString(),
      check_out: endDate.toISOString(),
      guest_count: 2,
      special_requests: 'Test reservation via BFF',
    });
    assert.assertHttpStatus(response.status, 201, 'Reservation creation should succeed');
    assert.assertHasProperty(response.body, 'id', 'Should return reservation ID');
    assert.assertHasProperty(response.body, 'status', 'Should have status');
    testData.reservationId = response.body.id;
  });

  // Step 5: Get reservation details via BFF (aggregation)
  await runner.runTest('User retrieves reservation details via BFF', async () => {
    if (!testData.reservationId) throw new Error('No reservation ID');

    // BFF GET /reservations/{id}/details aggregates reservation + hotel + room
    const response = await bffClient.get(`/reservations/${testData.reservationId}/details`);
    assert.assertHttpStatus(response.status, 200, 'Should retrieve reservation details');
    assert.assertHasProperty(response.body, 'reservation', 'Should have reservation');
    assert.assertHasProperty(response.body.reservation, 'id', 'Should have reservation ID');
  });

  // Step 6: List user reservations via BFF
  await runner.runTest('User lists their reservations via BFF', async () => {
    bffClient.setToken(testData.userToken!);
    // BFF GET /reservations returns user's own reservations
    const response = await bffClient.get('/reservations');
    assert.assertHttpStatus(response.status, 200, 'Should list user reservations');
    assert.assertHasProperty(response.body, 'reservations', 'Response should contain reservations');
    assert.assert(Array.isArray(response.body.reservations), 'Should be array');
  });

  // Step 7: Get hotel with rooms via BFF (aggregation)
  await runner.runTest('Get hotel with rooms via BFF (aggregation)', async () => {
    if (!testData.hotelId) throw new Error('No hotel ID');

    // BFF GET /hotels/{hotelId}/details aggregates hotel + rooms
    const response = await bffClient.get(`/hotels/${testData.hotelId}/details`);
    assert.assertHttpStatus(response.status, 200, 'Should retrieve hotel with rooms');
    assert.assertHasProperty(response.body, 'hotel', 'Should have hotel');
    assert.assertHasProperty(response.body, 'rooms', 'Should have rooms');
    assert.assert(Array.isArray(response.body.rooms), 'Rooms should be array');
  });

  // Step 8: Cancel reservation via Booking Service directly
  await runner.runTest('User cancels the reservation via Booking Service', async () => {
    if (!testData.reservationId) throw new Error('No reservation ID');

    // Note: BFF doesn't expose cancellation - use Booking Service directly
    bookingClient.setToken(testData.userToken!);
    const response = await bookingClient.post(`/bookings/${testData.reservationId}/cancel`, {});
    assert.assertHttpStatus(response.status, 200, 'Reservation cancellation should succeed');
  });

  runner.endSuite();
}

/**
 * Scenario 7: Booking Availability Conflicts
 */
async function testBookingConflicts(): Promise<void> {
  runner.startSuite('Business Scenario: Booking Availability Conflicts');

  const uniqueId = Date.now();

  // Create user and setup
  await runner.runTest('Setup: Create user for conflict test', async () => {
    const registerResponse = await userClient.post('/register', {
      email: `conflict_user_${uniqueId}@example.com`,
      password: 'Conflict123!',
      displayName: 'Conflict Test User',
      userType: 'user',
    });
    assert.assertHttpStatus(registerResponse.status, 201, 'User registration should succeed');

    const loginResponse = await userClient.post('/login', {
      email: `conflict_user_${uniqueId}@example.com`,
      password: 'Conflict123!',
    });
    assert.assertHttpStatus(loginResponse.status, 200, 'User login should succeed');
    testData.userToken = loginResponse.body.access_token;
    testData.testUserId = loginResponse.body.user?.id;

    bookingClient.setToken(testData.userToken!);
  });

  // Create booking for specific dates
  await runner.runTest('Create first booking to block dates', async () => {
    if (!testData.roomId || !testData.hotelId || !testData.testUserId) {
      console.log(' Skip: Setup incomplete');
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 30);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 35);

    const response = await bookingClient.post('/bookings', {
      user_id: testData.testUserId,
      hotel_id: testData.hotelId,
      room_id: testData.roomId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      guest_count: 2,
      total_price: 1000.00,
    });
    assert.assertHttpStatus(response.status, 201, 'First booking should succeed');
  });

  // Try to create overlapping booking
  await runner.runTest('Reject overlapping booking', async () => {
    if (!testData.roomId || !testData.hotelId || !testData.testUserId) {
      console.log(' Skip: Setup incomplete');
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 32); // Overlaps with first booking
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 34);

    const response = await bookingClient.post('/bookings', {
      user_id: testData.testUserId,
      hotel_id: testData.hotelId,
      room_id: testData.roomId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      guest_count: 2,
      total_price: 600.00,
    });
    assert.assertHttpStatus(response.status, 409, 'Overlapping booking should be rejected');
  });

  // Check availability reflects the booking
  await runner.runTest('Availability check shows room as unavailable', async () => {
    if (!testData.roomId) {
      console.log(' Skip: No room ID');
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 31);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 33);

    const response = await bookingClient.get(
      `/rooms/${testData.roomId}/availability?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
    );
    assert.assertHttpStatus(response.status, 200, 'Availability check should succeed');
    assert.assert(response.body.available === false, 'Room should be unavailable for blocked dates');
  });

  runner.endSuite();
}

/**
 * Scenario 8: Error Handling and Edge Cases
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

  await runner.runTest('Get non-existent booking returns 404', async () => {
    const response = await bookingClient.get('/bookings/non-existent-id');
    assert.assertHttpStatus(response.status, 404, 'Should return 404 for non-existent booking');
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

  await runner.runTest('Create booking without auth returns 401', async () => {
    bookingClient.clearToken();
    const response = await bookingClient.post('/bookings', {
      user_id: 'test-user',
      hotel_id: 'test-hotel',
      room_id: 'test-room',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      guest_count: 2,
      total_price: 100,
    });
    assert.assertHttpStatus(response.status, 401, 'Should return 401 without auth');
  });

  await runner.runTest('Invalid rating returns validation error', async () => {
    if (!testData.hotelId) {
      console.log(' Skip: No hotel ID for rating test');
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

  await runner.runTest('Unauthorized BFF request returns 401', async () => {
    bffClient.clearToken();
    const response = await bffClient.get('/hotels');
    assert.assertHttpStatus(response.status, 401, 'BFF should return 401 without auth');
  });

  await runner.runTest('Protected BFF aggregation requires auth', async () => {
    bffClient.clearToken();
    // Even a valid hotel ID without auth should fail
    const response = await bffClient.get('/hotels/test-hotel-id/details');
    assert.assertHttpStatus(response.status, 401, 'BFF aggregation should require auth');
  });

  runner.endSuite();
}

export async function runBusinessScenarios(): Promise<void> {
  await testHotelBookingFlow();
  await testAdminHotelManagement();
  await testGuestReviewFlow();
  await testRoomAvailabilityFlow();
  await testMediaAssetFlow();
  await testBookingFlowViaBFF();
  await testBookingConflicts();
  await testErrorHandling();
}

export { testData as businessTestData };
