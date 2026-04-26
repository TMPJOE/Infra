/**
 * End-to-End Integration Test Suite
 *
 * This suite validates the complete lifecycle and interactions between services
 * from user registration through hotel creation, room management, media uploads,
 * and reviews - simulating real-world usage patterns.
 *
 * Test Flow:
 * 1. Service Health Checks - All services must be healthy
 * 2. User Service - Register admin and regular users
 * 3. Hotel Service - Create hotels with media files
 * 4. Media Service - Upload and access hotel/room images
 * 5. Room Service - Create rooms for hotels
 * 6. Review Service - Create and list reviews
 * 7. Data Integrity - Verify cross-service data consistency
 * 8. Cleanup - Remove test data
 */

import config from "./test-config.ts";
import { TestClient } from "./test-client.ts";
import { TestRunner } from "./test-runner.ts";

// Test data storage
interface TestData {
  adminToken: string | null;
  userToken: string | null;
  adminId: string | null;
  userId: string | null;
  hotelId: string | null;
  roomId: string | null;
  bookingId: string | null;
  reservationId: string | null;
  uploadedMedia: any[];
}

const testData: TestData = {
  adminToken: null,
  userToken: null,
  adminId: null,
  userId: null,
  hotelId: null,
  roomId: null,
  bookingId: null,
  reservationId: null,
  uploadedMedia: [],
};

// Initialize clients
const userClient = new TestClient(config.baseUrl.userService);
const hotelClient = new TestClient(config.baseUrl.hotelService);
const mediaClient = new TestClient(config.baseUrl.mediaService);
const roomClient = new TestClient(config.baseUrl.roomService);
const bookingClient = new TestClient(config.baseUrl.bookingService);
const bffClient = new TestClient(config.baseUrl.bffService);

const runner = new TestRunner(true);

// ============================================================================
// SUITE 1: Service Health Checks
// ============================================================================
async function testServiceHealth(): Promise<void> {
	runner.startSuite("Service Health Checks");

	await runner.runTest("User Service health endpoint", async () => {
		const response = await userClient.get("/health");
		if (response.status !== 200)
			throw new Error(`Health check failed: ${response.status}`);
	});

	await runner.runTest("Hotel Service health endpoint", async () => {
		const response = await hotelClient.get("/health");
		if (response.status !== 200)
			throw new Error(`Health check failed: ${response.status}`);
	});

	await runner.runTest("Media Service health endpoint", async () => {
		const response = await mediaClient.get("/health");
		if (response.status !== 200)
			throw new Error(`Health check failed: ${response.status}`);
	});

	await runner.runTest("Room Service health endpoint", async () => {
		const response = await roomClient.get("/health");
		if (response.status !== 200)
			throw new Error(`Health check failed: ${response.status}`);
	});

	await runner.runTest("User Service readiness check", async () => {
		const response = await userClient.get("/ready");
		if (response.status !== 200)
			throw new Error(`Readiness check failed: ${response.status}`);
	});

  await runner.runTest("Hotel Service readiness check", async () => {
    const response = await hotelClient.get("/ready");
    if (response.status !== 200)
      throw new Error(`Readiness check failed: ${response.status}`);
  });

  await runner.runTest("Booking Service health endpoint", async () => {
    const response = await bookingClient.get("/health");
    if (response.status !== 200)
      throw new Error(`Health check failed: ${response.status}`);
  });

  await runner.runTest("Booking Service readiness check", async () => {
    const response = await bookingClient.get("/ready");
    if (response.status !== 200)
      throw new Error(`Readiness check failed: ${response.status}`);
  });

  await runner.runTest("BFF Service health endpoint", async () => {
    const response = await bffClient.get("/health");
    if (response.status !== 200)
      throw new Error(`Health check failed: ${response.status}`);
  });

  await runner.runTest("BFF Service readiness check", async () => {
    const response = await bffClient.get("/ready");
    if (response.status !== 200)
      throw new Error(`Readiness check failed: ${response.status}`);
  });

  runner.endSuite();
}

// ============================================================================
// SUITE 2: User Authentication Flow
// ============================================================================
async function testUserAuthentication(): Promise<void> {
	runner.startSuite("User Authentication Flow");

	const uniqueTimestamp = Date.now();
	const adminEmail = `admin_${uniqueTimestamp}@hotel.com`;
	const userEmail = `user_${uniqueTimestamp}@hotel.com`;

	await runner.runTest("Register admin user", async () => {
		const response = await userClient.post("/register", {
			email: adminEmail,
			password: config.credentials.adminPassword,
			display_name: "Test Admin",
			user_type: "admin",
		});
		if (response.status !== 201 && response.status !== 200) {
			throw new Error(`Registration failed: ${response.status}`);
		}
	});

await runner.runTest("Register regular user", async () => {
const response = await userClient.post("/register", {
email: userEmail,
password: config.credentials.userPassword,
display_name: "Test User",
user_type: "user",
});
		if (response.status !== 201 && response.status !== 200) {
			throw new Error(`Registration failed: ${response.status}`);
		}
	});

	await runner.runTest("Login admin user", async () => {
		const response = await userClient.post("/login", {
			email: adminEmail,
			password: config.credentials.adminPassword,
		});
		if (response.status !== 200 || !response.body.access_token) {
			throw new Error(`Admin login failed: ${response.status}`);
		}
		testData.adminToken = response.body.access_token;
		// Fetch profile to get user ID since it's not in the login response
		userClient.setToken(testData.adminToken!);
		const profileRes = await userClient.get("/profile");
		testData.adminId = profileRes.body.id || null;
	});

	await runner.runTest("Login regular user", async () => {
		const response = await userClient.post("/login", {
			email: userEmail,
			password: config.credentials.userPassword,
		});
		if (response.status !== 200 || !response.body.access_token) {
			throw new Error(`User login failed: ${response.status}`);
		}
		testData.userToken = response.body.access_token;
		// Fetch profile to get user ID since it's not in the login response
		userClient.setToken(testData.userToken!);
		const profileRes = await userClient.get("/profile");
		testData.userId = profileRes.body.id || null;
	});

	await runner.runTest("Verify admin token works", async () => {
		userClient.setToken(testData.adminToken!);
		const response = await userClient.get("/profile");
		if (response.status !== 200) {
			throw new Error(`Profile fetch failed: ${response.status}`);
		}
	});

	await runner.runTest("Verify user token works", async () => {
		userClient.setToken(testData.userToken!);
		const response = await userClient.get("/profile");
		if (response.status !== 200) {
			throw new Error(`Profile fetch failed: ${response.status}`);
		}
	});

	runner.endSuite();
}

// ============================================================================
// SUITE 3: Hotel CRUD Operations
// ============================================================================
async function testHotelOperations(): Promise<void> {
	runner.startSuite("Hotel CRUD Operations");

	await runner.runTest("List hotels (empty initially)", async () => {
		hotelClient.setToken(testData.adminToken!);
		const response = await hotelClient.get("/hotels");
		if (response.status !== 200) {
			throw new Error(`List hotels failed: ${response.status}`);
		}
	});

	await runner.runTest("Create hotel (admin only)", async () => {
		hotelClient.setToken(testData.adminToken!);
		const response = await hotelClient.post("/hotels", {
			name: "Grand Test Hotel",
			city: "Test City",
			description: "A beautiful test hotel",
			lat: 40.7128,
			lng: -74.006,
		});
		if (response.status !== 201 && response.status !== 200) {
			throw new Error(
				`Create hotel failed: ${response.status} - ${JSON.stringify(response.body)}`,
			);
		}
		testData.hotelId = response.body.id;
	});

	await runner.runTest("Get hotel by ID", async () => {
		if (!testData.hotelId) throw new Error("No hotel ID available");
		const response = await hotelClient.get(`/hotels/${testData.hotelId}`);
		if (response.status !== 200) {
			throw new Error(`Get hotel failed: ${response.status}`);
		}
		if (response.body.name !== "Grand Test Hotel") {
			throw new Error("Hotel name mismatch");
		}
	});

	await runner.runTest("List hotels with city filter", async () => {
		const response = await hotelClient.get("/hotels?city=Test%20City");
		if (response.status !== 200) {
			throw new Error(`Filter hotels failed: ${response.status}`);
		}
		const hotels = response.body;
		if (!Array.isArray(hotels) || hotels.length === 0) {
			throw new Error("Expected hotels in result");
		}
	});

	await runner.runTest("Update hotel (admin only)", async () => {
		if (!testData.hotelId) throw new Error("No hotel ID available");
		hotelClient.setToken(testData.adminToken!);
		const response = await hotelClient.put(`/hotels/${testData.hotelId}`, {
			name: "Updated Grand Test Hotel",
			description: "Updated description",
		});
		if (response.status !== 200) {
			throw new Error(`Update hotel failed: ${response.status}`);
		}
	});

	await runner.runTest("Verify hotel update", async () => {
		if (!testData.hotelId) throw new Error("No hotel ID available");
		const response = await hotelClient.get(`/hotels/${testData.hotelId}`);
		if (response.status !== 200) {
			throw new Error(`Get hotel failed: ${response.status}`);
		}
		if (response.body.name !== "Updated Grand Test Hotel") {
			throw new Error("Hotel update verification failed");
		}
	});

	runner.endSuite();
}

// ============================================================================
// SUITE 4: Media Service Integration
// ============================================================================
async function testMediaOperations(): Promise<void> {
	runner.startSuite("Media Service Integration");

	await runner.runTest("Upload hotel image via Media Service", async () => {
		if (!testData.hotelId) throw new Error("No hotel ID available");

		const testImage = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
			"base64",
		);

		const formData = new FormData();
		formData.append(
			"file",
			new Blob([testImage], { type: "image/png" }),
			"test-hotel.png",
		);
		formData.append("asset_type", "hotel");
		formData.append("asset_id", testData.hotelId);

		mediaClient.setToken(testData.adminToken!);
		const response = await mediaClient.request("POST", "/upload", {
			body: formData,
			isMultipart: true,
		});

		if (response.status !== 201 && response.status !== 200) {
			throw new Error(
				`Upload failed: ${response.status} - ${JSON.stringify(response.body)}`,
			);
		}

		testData.uploadedMedia.push({
			type: "hotel",
			id: testData.hotelId,
			response: response.body,
		});
	});

	await runner.runTest("List hotel images", async () => {
		if (!testData.hotelId) throw new Error("No hotel ID available");
		const response = await mediaClient.get(
			`/hotels/${testData.hotelId}/images`,
		);
		if (response.status !== 200) {
			throw new Error(`List images failed: ${response.status}`);
		}
	});

	await runner.runTest("Download image from Media Service", async () => {
		if (testData.uploadedMedia.length === 0)
			throw new Error("No media uploaded");
		const media = testData.uploadedMedia[0];
		const response = await mediaClient.get(
			`/download/${media.response.bucket}/${media.response.key}`,
		);
		if (response.status !== 200) {
			throw new Error(`Download failed: ${response.status}`);
		}
	});

	runner.endSuite();
}

// ============================================================================
// SUITE 5: Room Service Integration
// ============================================================================
async function testRoomOperations(): Promise<void> {
	runner.startSuite("Room Service Integration");

  await runner.runTest("Create room for hotel (admin only)", async () => {
    if (!testData.hotelId) throw new Error("No hotel ID available");
    roomClient.setToken(testData.adminToken!);

    const response = await roomClient.post(`/hotels/${testData.hotelId}/rooms`, {
      name: "Deluxe Suite",
      type: "Suite",
      capacity: 2,
      price: 299.99,
      quantity: 10,
      description: "Luxury suite with ocean view",
    });

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(
        `Create room failed: ${response.status} - ${JSON.stringify(response.body)}`,
      );
    }
    // Response is an array of created rooms (one per quantity)
    const rooms = Array.isArray(response.body) ? response.body : [response.body];
    if (rooms.length === 0 || !rooms[0].id) {
      throw new Error(`Room created but no ID returned. Response: ${JSON.stringify(response.body)}`);
    }
    // Store the first room's ID for subsequent tests
    testData.roomId = rooms[0].id;
  });

  await runner.runTest("List rooms by hotel", async () => {
    if (!testData.hotelId) throw new Error("No hotel ID available");
    const response = await roomClient.get(`/rooms/list/${testData.hotelId}`);
    if (response.status !== 200) {
      throw new Error(`List rooms failed: ${response.status}`);
    }
    // Response might be wrapped in an object with rooms property or direct array
    const rooms = response.body.rooms || response.body;
    if (!Array.isArray(rooms) || rooms.length === 0) {
      throw new Error("Expected rooms in result");
    }
  });

	await runner.runTest("Get room by ID", async () => {
		if (!testData.roomId) throw new Error("No room ID available");
		const response = await roomClient.get(`/rooms/${testData.roomId}`);
		if (response.status !== 200) {
			throw new Error(`Get room failed: ${response.status}`);
		}
	});

  await runner.runTest("Check room availability", async () => {
    if (!testData.hotelId) throw new Error("No hotel ID available");
    const response = await roomClient.get(
      `/rooms/available/${testData.hotelId}?type=Suite&name=Deluxe%20Suite`,
    );
    if (response.status !== 200) {
      throw new Error(`Availability check failed: ${response.status}`);
    }
  });

  await runner.runTest("Update room (admin only)", async () => {
    if (!testData.hotelId) throw new Error("No hotel ID available");
    if (!testData.roomId) throw new Error("No room ID available");
    roomClient.setToken(testData.adminToken!);
    const response = await roomClient.put(`/hotels/${testData.hotelId}/rooms/${testData.roomId}`, {
      price: 349.99,
      description: "Updated luxury suite",
    });
    if (response.status !== 200) {
      throw new Error(`Update room failed: ${response.status}`);
    }
  });

  await runner.runTest("Update room quantity (admin only)", async () => {
    if (!testData.hotelId) throw new Error("No hotel ID available");
    roomClient.setToken(testData.adminToken!);
    const response = await roomClient.patch(
      `/hotels/${testData.hotelId}/rooms/Suite/Deluxe%20Suite/quantity`,
      {
        quantity: 15,
      },
    );
    // PATCH may return 200 or 204 (No Content)
    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`Update quantity failed: ${response.status}`);
    }
  });

	runner.endSuite();
}

// ============================================================================
// SUITE 6: Review Operations
// ============================================================================
async function testReviewOperations(): Promise<void> {
	runner.startSuite("Review Operations");

	await runner.runTest(
		"Create review for hotel (authenticated user)",
		async () => {
			if (!testData.hotelId) throw new Error("No hotel ID available");
			hotelClient.setToken(testData.userToken!);

			const response = await hotelClient.post(
				`/hotels/${testData.hotelId}/reviews`,
				{
					rating: 5,
					comment: "Excellent service and amenities!",
				},
			);

			if (response.status !== 201) {
				throw new Error(
					`Create review failed: ${response.status} - ${JSON.stringify(response.body)}`,
				);
			}
		},
	);

	await runner.runTest("List reviews by hotel", async () => {
		if (!testData.hotelId) throw new Error("No hotel ID available");
		hotelClient.setToken(testData.userToken!);
		const response = await hotelClient.get(
			`/hotels/${testData.hotelId}/reviews`,
		);
		if (response.status !== 200) {
			throw new Error(`List reviews failed: ${response.status}`);
		}
		if (!Array.isArray(response.body) || response.body.length === 0) {
			throw new Error("Expected reviews in result");
		}
	});

	await runner.runTest("Verify hotel rating updated", async () => {
		if (!testData.hotelId) throw new Error("No hotel ID available");
		const response = await hotelClient.get(`/hotels/${testData.hotelId}`);
		if (response.status !== 200) {
			throw new Error(`Get hotel failed: ${response.status}`);
		}
		if (response.body.rating === undefined || response.body.rating === null) {
			throw new Error("Hotel rating should be updated after review");
		}
	});

	runner.endSuite();
}

// ============================================================================
// SUITE 7: Cross-Service Data Integrity
// ============================================================================
async function testDataIntegrity(): Promise<void> {
	runner.startSuite("Cross-Service Data Integrity");

	await runner.runTest("Verify media linked to hotel", async () => {
		if (!testData.hotelId) throw new Error("No hotel ID available");
		const response = await mediaClient.get(
			`/hotels/${testData.hotelId}/images`,
		);
		if (response.status !== 200) {
			throw new Error(`Media verification failed: ${response.status}`);
		}
	});

  await runner.runTest("Verify rooms linked to hotel", async () => {
    if (!testData.hotelId) throw new Error("No hotel ID available");
    const response = await roomClient.get(`/rooms/list/${testData.hotelId}`);
    if (response.status !== 200) {
      throw new Error(`Room verification failed: ${response.status}`);
    }
    // Response might be wrapped in an object with rooms property or direct array
    const rooms = response.body.rooms || response.body;
    if (!Array.isArray(rooms) || rooms.length === 0) {
      throw new Error("Expected rooms for hotel");
    }
  });

	await runner.runTest("Verify reviews linked to hotel", async () => {
		if (!testData.hotelId) throw new Error("No hotel ID available");
		const response = await hotelClient.get(
			`/hotels/${testData.hotelId}/reviews`,
		);
		if (response.status !== 200) {
			throw new Error(`Review verification failed: ${response.status}`);
		}
	});

	await runner.runTest(
		"Verify hotel exists in list after all operations",
		async () => {
			const response = await hotelClient.get("/hotels");
			if (response.status !== 200) {
				throw new Error(`List hotels failed: ${response.status}`);
			}
			const hotels = response.body;
			const found = hotels.find((h: any) => h.id === testData.hotelId);
			if (!found) {
				throw new Error("Hotel not found in list after operations");
			}
		},
	);

	runner.endSuite();
}

// ============================================================================
// SUITE 8: Authorization and Security
// ============================================================================
async function testAuthorization(): Promise<void> {
	runner.startSuite("Authorization & Security");

  await runner.runTest("Non-admin cannot create room", async () => {
    if (!testData.hotelId) throw new Error("No hotel ID available");
    roomClient.setToken(testData.userToken!);
    const response = await roomClient.post(`/hotels/${testData.hotelId}/rooms`, {
      name: "Test Room",
      type: "Test",
      capacity: 1,
      price: 100,
      quantity: 1,
    });
    if (response.status !== 403) {
      throw new Error(`Expected 403, got: ${response.status}`);
    }
  });

	await runner.runTest("Non-admin cannot update hotel", async () => {
		if (!testData.hotelId) throw new Error("No hotel ID available");
		hotelClient.setToken(testData.userToken!);
		const response = await hotelClient.put(`/hotels/${testData.hotelId}`, {
			name: "Unauthorized Update",
		});
		if (response.status !== 403) {
			throw new Error(`Expected 403, got: ${response.status}`);
		}
	});

	await runner.runTest("Non-admin cannot delete hotel", async () => {
		if (!testData.hotelId) throw new Error("No hotel ID available");
		hotelClient.setToken(testData.userToken!);
		const response = await hotelClient.delete(`/hotels/${testData.hotelId}`);
		if (response.status !== 403) {
			throw new Error(`Expected 403, got: ${response.status}`);
		}
	});

  await runner.runTest("Unauthorized request returns 401", async () => {
    hotelClient.clearToken();
    const response = await hotelClient.post("/hotels", {
      name: "Unauthorized Hotel",
      city: "Test",
    });
    if (response.status !== 401) {
      throw new Error(`Expected 401, got: ${response.status}`);
    }
  });

  runner.endSuite();
}

// ============================================================================
// SUITE 9: Booking Service Operations
// ============================================================================
async function testBookingOperations(): Promise<void> {
  runner.startSuite("Booking Service Operations");

  await runner.runTest("List all bookings", async () => {
    bookingClient.setToken(testData.adminToken!);
    const response = await bookingClient.get("/bookings");
    if (response.status !== 200) {
      throw new Error(`List bookings failed: ${response.status}`);
    }
    if (!Array.isArray(response.body) && response.body !== null) {
      throw new Error("Expected array of bookings or null");
    }
  });

  await runner.runTest("Create booking for user", async () => {
    if (!testData.hotelId || !testData.roomId || !testData.userId) {
      throw new Error("Missing required IDs");
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 14);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 17);

    bookingClient.setToken(testData.userToken!);
    const response = await bookingClient.post("/bookings", {
      user_id: testData.userId,
      hotel_id: testData.hotelId,
      room_id: testData.roomId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      guest_count: 2,
      total_price: 450.0,
    });

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(
        `Create booking failed: ${response.status} - ${JSON.stringify(response.body)}`,
      );
    }
    testData.bookingId = response.body.id;
  });

  await runner.runTest("Get booking by ID", async () => {
    if (!testData.bookingId) throw new Error("No booking ID available");
    const response = await bookingClient.get(`/bookings/${testData.bookingId}`);
    if (response.status !== 200) {
      throw new Error(`Get booking failed: ${response.status}`);
    }
    if (!response.body.id) {
      throw new Error("Expected booking to have id");
    }
  });

  await runner.runTest("List bookings by user", async () => {
    if (!testData.userId) throw new Error("No user ID available");
    const response = await bookingClient.get(`/users/${testData.userId}/bookings`);
    if (response.status !== 200) {
      throw new Error(`List user bookings failed: ${response.status}`);
    }
    if (!Array.isArray(response.body.bookings) && !Array.isArray(response.body) && response.body !== null) {
      throw new Error("Expected bookings array or null");
    }
  });

  await runner.runTest("List bookings by hotel", async () => {
    if (!testData.hotelId) throw new Error("No hotel ID available");
    bookingClient.setToken(testData.adminToken!);
    const response = await bookingClient.get(`/hotels/${testData.hotelId}/bookings`);
    if (response.status !== 200) {
      throw new Error(`List hotel bookings failed: ${response.status}`);
    }
    if (!Array.isArray(response.body.bookings) && !Array.isArray(response.body) && response.body !== null) {
      throw new Error("Expected bookings array or null");
    }
  });

  await runner.runTest("Check room availability", async () => {
    if (!testData.roomId) throw new Error("No room ID available");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);

    const response = await bookingClient.get(
      `/rooms/${testData.roomId}/availability?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
    );
    if (response.status !== 200) {
      throw new Error(`Availability check failed: ${response.status}`);
    }
  });

  await runner.runTest("Update booking status to confirmed", async () => {
    if (!testData.bookingId) throw new Error("No booking ID available");
    bookingClient.setToken(testData.adminToken!);
    const response = await bookingClient.patch(`/bookings/${testData.bookingId}/status`, {
      status: "confirmed",
    });
    if (response.status !== 200) {
      throw new Error(`Update booking status failed: ${response.status}`);
    }
  });

  runner.endSuite();
}

// ============================================================================
// SUITE 10: BFF Service Operations
// ============================================================================
async function testBFFOperations(): Promise<void> {
  runner.startSuite("BFF Service Operations");

  await runner.runTest("Get hotels via BFF", async () => {
    bffClient.setToken(testData.userToken!);
    const response = await bffClient.get("/hotels");
    if (response.status !== 200) {
      throw new Error(`Get hotels via BFF failed: ${response.status}`);
    }
    if (!Array.isArray(response.body)) {
      throw new Error("Expected array of hotels");
    }
  });

  await runner.runTest("Get hotel by ID via BFF", async () => {
    if (!testData.hotelId) throw new Error("No hotel ID available");
    const response = await bffClient.get(`/hotels/${testData.hotelId}`);
    if (response.status !== 200) {
      throw new Error(`Get hotel via BFF failed: ${response.status}`);
    }
    if (response.body.id !== testData.hotelId) {
      throw new Error("Hotel ID mismatch");
    }
  });

  await runner.runTest("Get hotel with rooms via BFF (aggregation)", async () => {
    if (!testData.hotelId) throw new Error("No hotel ID available");
    const response = await bffClient.get(`/hotels/${testData.hotelId}/details`);
    if (response.status !== 200) {
      throw new Error(`Get hotel details via BFF failed: ${response.status}`);
    }
    // BFF returns aggregated data with hotel and rooms
    if (!response.body.hotel && !response.body.id) {
      throw new Error("Expected hotel data in response");
    }
  });

  await runner.runTest("Get room by ID via BFF", async () => {
    if (!testData.roomId) throw new Error("No room ID available");
    const response = await bffClient.get(`/rooms/${testData.roomId}`);
    if (response.status !== 200) {
      throw new Error(`Get room via BFF failed: ${response.status}`);
    }
    if (!response.body.id) {
      throw new Error("Expected room to have id");
    }
  });

  await runner.runTest("Create room via BFF (bridge pattern)", async () => {
    if (!testData.hotelId) throw new Error("No hotel ID available");
    bffClient.setToken(testData.adminToken!);
    const response = await bffClient.post(`/hotels/${testData.hotelId}/rooms`, {
      hotel_id: testData.hotelId,
      name: "BFF Deluxe Room",
      type: "BFF Test Suite",
      price: 250.0,
      capacity: 3,
      quantity: 5,
      description: "Room created via BFF bridge",
      space_info: "35 sqm with balcony",
      bed_distribution: "1 King Bed, 1 Sofa Bed",
    });
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(
        `Create room via BFF failed: ${response.status} - ${JSON.stringify(response.body)}`,
      );
    }
  });

  await runner.runTest("Get reservations via BFF", async () => {
    bffClient.setToken(testData.userToken!);
    const response = await bffClient.get("/reservations");
    // Returns 200 with user's reservations
    if (response.status !== 200) {
      throw new Error(`Get reservations via BFF failed: ${response.status}`);
    }
  });

  await runner.runTest("Create reservation via BFF (bridge pattern)", async () => {
    if (!testData.hotelId || !testData.roomId) throw new Error("No hotel/room ID available");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 21);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 24);

    bffClient.setToken(testData.userToken!);
    const response = await bffClient.post("/reservations", {
      hotel_id: testData.hotelId,
      room_id: testData.roomId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      guest_count: 2,
      guest_name: "Test User",
      guest_email: "test@example.com",
    });

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(
        `Create reservation via BFF failed: ${response.status} - ${JSON.stringify(response.body)}`,
      );
    }
    if (response.body?.id) {
      testData.reservationId = response.body.id;
    }
  });

  await runner.runTest("Get reservation details via BFF (aggregation)", async () => {
    if (!testData.reservationId) {
      console.log(" Skip: No reservation ID");
      return;
    }
    const response = await bffClient.get(`/reservations/${testData.reservationId}/details`);
    if (response.status !== 200) {
      throw new Error(`Get reservation details via BFF failed: ${response.status}`);
    }
    // BFF returns aggregated data with reservation, hotel and room details
    if (!response.body.reservation && !response.body.id) {
      throw new Error("Expected reservation data in response");
    }
  });

  await runner.runTest("Unauthorized BFF request returns 401", async () => {
    bffClient.clearToken();
    const response = await bffClient.get("/hotels");
    if (response.status !== 401) {
      throw new Error(`Expected 401, got: ${response.status}`);
    }
  });

  runner.endSuite();
}

// ============================================================================
// SUITE 11: Cleanup
// ============================================================================
async function cleanupTestData(): Promise<void> {
	runner.startSuite("Cleanup Test Data");

  await runner.runTest("Delete test room", async () => {
    if (!testData.hotelId) {
      console.log(" Skip: No hotel ID");
      return;
    }
    if (!testData.roomId) {
      console.log(" Skip: No room ID");
      return;
    }
    roomClient.setToken(testData.adminToken!);
    const response = await roomClient.delete(`/hotels/${testData.hotelId}/rooms/${testData.roomId}`);
    // DELETE returns 204 (No Content) on success
    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`Delete room failed: ${response.status}`);
    }
  });

  await runner.runTest("Delete test hotel", async () => {
    if (!testData.hotelId) {
      console.log(" Skip: No hotel ID");
      return;
    }
    hotelClient.setToken(testData.adminToken!);
    const response = await hotelClient.delete(`/hotels/${testData.hotelId}`);
    if (response.status !== 200) {
      throw new Error(`Delete hotel failed: ${response.status}`);
    }
  });

  await runner.runTest("Cancel test booking", async () => {
    if (!testData.bookingId) {
      console.log(" Skip: No booking ID");
      return;
    }
    bookingClient.setToken(testData.userToken!);
    const response = await bookingClient.post(`/bookings/${testData.bookingId}/cancel`, {});
    // POST returns 200 on success
    if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
      throw new Error(`Cancel booking failed: ${response.status}`);
    }
  });

  runner.endSuite();
}

// Export test functions for use in index.ts
export {
  testServiceHealth,
  testUserAuthentication,
  testHotelOperations,
  testMediaOperations,
  testRoomOperations,
  testReviewOperations,
  testDataIntegrity,
  testAuthorization,
  testBookingOperations,
  testBFFOperations,
  cleanupTestData,
  runner,
  testData,
};

// ============================================================================
// Main Execution (when run directly)
// ============================================================================
async function main(): Promise<void> {
	console.log("\n╔══════════════════════════════════════════════════════════╗");
	console.log("║     End-to-End Integration Test Suite                    ║");
	console.log("║     Hotel Microservices Platform                         ║");
	console.log("╚══════════════════════════════════════════════════════════╝\n");

  console.log("Configuration:");
  console.log(` API Gateway: ${config.baseUrl.apiGateway}`);
  console.log(` User Service: ${config.baseUrl.userService}`);
  console.log(` Hotel Service: ${config.baseUrl.hotelService}`);
  console.log(` Media Service: ${config.baseUrl.mediaService}`);
  console.log(` Room Service: ${config.baseUrl.roomService}`);
  console.log(` Booking Service: ${config.baseUrl.bookingService}`);
  console.log(` BFF Service: ${config.baseUrl.bffService}`);
  console.log("\n");

  try {
    await testServiceHealth();
    await testUserAuthentication();
    await testHotelOperations();
    await testMediaOperations();
    await testRoomOperations();
    await testReviewOperations();
    await testDataIntegrity();
    await testAuthorization();
    await testBookingOperations();
    await testBFFOperations();
    await cleanupTestData();

		console.log(runner.getReport());

		if (!runner.hasPassed()) {
			process.exit(1);
		}
	} catch (error) {
		console.error("\nTest suite failed with error:", error);
		console.log(runner.getReport());
		process.exit(1);
	}
}

main();
