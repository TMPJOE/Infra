# Hotel Microservices Integration Test Suite

End-to-end integration testing suite for the Hotel Microservices platform. This test suite validates all service endpoints by simulating realistic application flows rather than isolated unit tests.

## Architecture

The test suite validates the following services defined in the `docker-compose.yml`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API Gateway (8080)                                │
│                    Routes requests to appropriate services                   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  /api/v1/users/*    → User Service                                  │   │
│   │  /api/v1/hotels/*   → Hotel Service                                 │   │
│   │  /api/v1/rooms/*    → Room Service                                  │   │
│   │  /api/v1/bookings/* → Booking Service                               │   │
│   │  /api/v1/media/*    → Media Service                                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌──────────────┐          ┌──────────────────┐          ┌──────────────────┐
│  User Service│          │  Hotel Service   │          │  Room Service    │
│  (8081)      │          │  (8084)          │          │  (8085)          │
├──────────────┤          ├──────────────────┤          ├──────────────────┤
│ - Register   │          │ - CRUD Hotels    │          │ - CRUD Rooms     │
│ - Login      │          │ - Reviews        │          │ - Availability   │
│ - Profile    │          │ - Ratings        │          │ - Hotel Links    │
│              │          │ - Media Client   │          │ - Media Client   │
└──────┬───────┘          └───────┬──────────┘          └───────┬──────────┘
       │                          │                           │
       │                          │                           │
       │                          ▼                           ▼
       │                   ┌──────────────┐            ┌──────────────┐
       │                   │ Media Service│            │ Media Service│
       │                   │ (8082)       │            │ (direct)     │
       │                   └──────┬───────┘            └──────┬───────┘
       │                          │                           │
       │                          ▼                           ▼
       │                   ┌──────────────┐            ┌──────────────┐
       │                   │   MinIO      │            │   MinIO      │
       │                   │  (9000)      │            │  (9000)      │
       │                   └──────────────┘            └──────────────┘
       │
       │         ┌──────────────────┐
       └────────►│  user-db       │
                 │  (Postgres 5433)│
                 └──────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     Booking Service (8086)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ - Create/Manage Bookings                                                    │
│ - Check Room Availability                                                   │
│ - Booking Status Management (pending, confirmed, cancelled)                 │
│ - List Bookings by User/Hotel/Room                                          │
│                                                                             │
│ Note: Booking service does NOT have direct media access. Media uploads     │
│ should be done via Hotel/Room services or directly via Media Service.      │
└──────┬────────────────────────────────────────────────────────────────────┘
       │
       │
┌──────▼──────────┐
│  booking-db     │
│  (Postgres 5437)│
└─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     BFF Service (8087) - OPTIONAL                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Backend for Frontend - Provides convenience endpoints that aggregate       │
│ calls to Hotel, Room, Booking, and User services for frontend applications.  │
│                                                                             │
│ IMPORTANT: BFF does NOT replace API Gateway. All services remain directly │
│ accessible via API Gateway. BFF is an optional convenience layer.           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Service Communication Patterns

### Direct API Gateway Access (Primary)
All services are accessible directly through the API Gateway:

```
Client → API Gateway → Hotel/Room/Booking/Media/User Service
                              ↓
                         Media Service (for file operations)
```

### BFF Aggregated Access (Optional)
BFF provides convenience methods for frontend applications:

```
Frontend → BFF Service → Hotel/Room/Booking/Media/User Services
                              ↓
                         Aggregated responses
```

### Internal Service Communication
Hotel and Room services communicate directly with Media service for file operations:

```
Hotel Service ──┐
                ├──► Media Service ──► MinIO
Room Service ───┘
```

## Test Suites

### 1. Service Health Checks
- Validates all services are running
- Checks health endpoints
- Verifies database connections

### 2. User Authentication Flow
- User registration
- User login
- JWT token validation
- Profile management

### 3. Hotel CRUD Operations
- Create hotels (admin only)
- List hotels with filters
- Get hotel by ID
- Update hotel (admin only)
- Delete hotel (admin only)

### 4. Room Service Integration
- Create rooms for hotels
- List rooms by hotel
- Room availability checks
- Update room details
- Manage room inventory

### 5. Booking Service Integration
- Create bookings via API Gateway
- Check room availability
- Manage booking status (pending, confirmed, cancelled)
- List bookings by user/hotel/room
- Cancel bookings
- Verify availability conflicts

### 6. Media Service Integration
- Upload hotel images (via Hotel Service or directly)
- Upload room images (via Room Service or directly)
- List hotel images
- List room images
- Download media files

### 7. Review Operations
- Create reviews (authenticated users)
- List reviews by hotel
- Hotel rating updates
- Review validation

### 8. Cross-Service Data Integrity
- Media linked to hotels
- Rooms linked to hotels
- Reviews linked to hotels
- Bookings linked to hotels/rooms/users
- Data consistency across services

### 9. Authorization & Security
- Role-based access control
- Admin-only operations
- Unauthorized access prevention
- Token validation

### 10. Business Logic Scenarios
- Hotel booking flow via API Gateway (primary)
- Hotel booking flow via BFF (optional/convenience)
- Admin hotel management
- Guest review flow
- Room availability checks
- Media asset management via Hotel/Room services
- Booking availability conflicts
- Complete end-to-end reservation flow

## Installation

```bash
cd Infra/tests
npm install
```

## Configuration

The test suite uses environment variables defined in `../.env`. You can override them by creating a `.env` file in the tests directory:

```bash
# Service URLs (via API Gateway - primary)
API_GATEWAY_URL=http://localhost:8080

# Direct Service URLs (for direct testing)
USER_SERVICE_URL=http://localhost:8081
MEDIA_SERVICE_URL=http://localhost:8082
HOTEL_SERVICE_URL=http://localhost:8084
ROOM_SERVICE_URL=http://localhost:8085
BOOKING_SERVICE_URL=http://localhost:8086

# BFF Service URL (optional/convenience)
BFF_SERVICE_URL=http://localhost:8087

# Test credentials
ADMIN_EMAIL=admin@hotel.com
ADMIN_PASSWORD=Admin123!
USER_EMAIL=user@hotel.com
USER_PASSWORD=User123!

# Timeouts
REQUEST_TIMEOUT=30000
HEALTHY_TIMEOUT=120000
REQUEST_DELAY=100
```

## Running Tests

### Run All Tests
```bash
npm run test
```

### Run Health Checks Only
```bash
npm run test:health
```

### Run Business Scenarios
```bash
npm run test:business
```

### Run with Docker Compose
```bash
# From the Infra directory
docker-compose up --build

# Then run tests
cd tests
npm run test
```

### Run Individual Test Files
```bash
npx tsx e2e-test-suite.ts
npx tsx business-scenarios.ts
npx tsx health-check.ts
```

## Test Flow

The tests execute in the following order:

1. **Infrastructure Validation**
   - Service health checks
   - Database connectivity
   - Inter-service communication

2. **Authentication & Authorization**
   - User registration
   - Token generation
   - Role-based access

3. **Core Business Operations**
   - Hotel management (CRUD)
   - Room management (CRUD)
   - Booking management (CRUD)
   - Media uploads via Hotel/Room services
   - Review system

4. **API Gateway Integration Testing**
   - Direct service calls via API Gateway
   - Cross-service data validation

5. **BFF Integration Testing (Optional)**
   - Aggregated hotel + room data via BFF
   - Convenience endpoints for frontend

6. **Integration Validation**
   - Cross-service data consistency
   - Media service integration (Hotel/Room → Media → MinIO)
   - Foreign key relationships
   - Booking availability logic

7. **Security Testing**
   - Unauthorized access
   - Permission validation
   - Token expiration

8. **Cleanup**
   - Remove test data
   - Reset state

## Real-World Scenarios Tested

### Scenario 1: Complete Hotel Booking Flow via API Gateway (Primary)
A complete end-to-end flow through the API Gateway:
1. User registers via API Gateway → User Service
2. User logs in via API Gateway → User Service
3. Admin creates hotel via API Gateway → Hotel Service
4. Admin creates room via API Gateway → Room Service
5. User checks room availability via API Gateway → Booking Service
6. User creates a booking via API Gateway → Booking Service
7. Admin confirms the booking via API Gateway → Booking Service
8. User views their bookings via API Gateway → Booking Service
9. User cancels the booking via API Gateway → Booking Service

### Scenario 2: Complete Hotel Booking Flow via BFF (Optional)
Same flow but through BFF for frontend convenience:
1. User registers via BFF (calls User Service)
2. User logs in via BFF (calls User Service)
3. Admin creates hotel via BFF (calls Hotel Service)
4. Admin creates room via BFF (calls Room Service)
5. User checks room availability via BFF (calls Booking Service)
6. User creates a booking via BFF (calls Booking Service)
7. Admin confirms via BFF (calls Booking Service)
8. User views bookings via BFF (calls Booking Service)
9. User cancels via BFF (calls Booking Service)

### Scenario 3: Admin Hotel Management Flow
An admin creates a hotel, adds rooms, and manages inventory through API Gateway.

### Scenario 4: Guest Review Flow
A guest stays at a hotel and leaves a review that updates the hotel's rating.

### Scenario 5: Room Availability
Checking room availability for specific dates and guest counts via Booking Service.

### Scenario 6: Media Asset Management via Hotel/Room Services
Hotels and rooms have associated images uploaded through the Hotel/Room services which internally communicate with Media Service:

```
POST /api/v1/hotels/{id}/images → Hotel Service → Media Service → MinIO
POST /api/v1/rooms/{id}/images → Room Service → Media Service → MinIO
```

### Scenario 7: Booking Availability Conflicts
Tests that overlapping bookings are properly rejected:
- First booking blocks dates
- Second overlapping booking is rejected
- Availability check reflects blocked dates

### Scenario 8: Direct Media Upload
Media can also be uploaded directly via Media Service:
```
POST /api/v1/media/upload → Media Service → MinIO
```

## Data Flow

### Via API Gateway (Primary)

```
User Registration/Login
│
▼
┌──────────────────┐
│ Get JWT Token    │
└──────────────────┘
│
├─────────────┬─────────────┬─────────────┬─────────────┐
▼             ▼             ▼             ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Create   │ │List     │ │Get      │ │Review   │ │Book     │
│Hotel    │ │Hotels   │ │Hotel    │ │Hotel    │ │Room     │
│(Admin)  │ │         │ │by ID    │ │         │ │         │
└────┬────┘ └─────────┘ └─────────┘ └─────────┘ └────┬────┘
     │                                               │
     ▼                                               ▼
┌──────────────┐                           ┌──────────────────┐
│ Upload Media │───► Media Service ──► MinIO │ Check Room Avail.│
│ (via Hotel)  │                             │ via API Gateway  │
└──────┬───────┘                             └────────┬─────────┘
       │                                              │
       ▼                                              ▼
┌──────────────┐                           ┌──────────────────┐
│ Create Rooms │                           │ Create Booking   │
│ (Admin)      │                           │ via API Gateway  │
└──────────────┘                           └──────────────────┘
                                                    │
                       ┌────────────────────────────┼────────────────────────────┐
                       │                            │                            │
                       ▼                            ▼                            ▼
              ┌──────────────┐              ┌──────────────┐              ┌──────────────┐
              │ Hotel DB     │              │ Booking DB   │              │ User DB      │
              └──────────────┘              └──────────────┘              └──────────────┘
```

### Via BFF (Optional Convenience Layer)

```
Frontend → BFF Service → API Gateway → Microservices
                              ↓
                         Aggregated Responses
```

## Output Format

Tests output a detailed report:

```
╔══════════════════════════════════════════════════════════╗
║ End-to-End Integration Test Suite                        ║
║ Hotel Microservices Platform                             ║
╚══════════════════════════════════════════════════════════╝

============================================================
SUITE: Service Health Checks
============================================================
✓ User Service health endpoint (45ms)
✓ Hotel Service health endpoint (32ms)
✓ Booking Service health endpoint (28ms)
✓ BFF Service health endpoint (35ms)
✓ Media Service health endpoint (28ms)
✓ Room Service health endpoint (30ms)
✓ User Service readiness check (102ms)
✓ Hotel Service readiness check (98ms)
✓ Booking Service readiness check (95ms)

Suite Summary: 9 passed, 0 failed (335ms)

============================================================
SUITE: Business Scenario: Complete Booking Flow via API Gateway
============================================================
✓ User registers via API Gateway (145ms)
✓ User logs in via API Gateway (89ms)
✓ Admin creates hotel via API Gateway (156ms)
✓ Admin creates room via API Gateway (134ms)
✓ Check room availability via API Gateway (78ms)
✓ User creates a booking via API Gateway (234ms)
✓ User retrieves booking details via API Gateway (56ms)
✓ Admin confirms the booking via API Gateway (112ms)
✓ User lists their bookings via API Gateway (67ms)
✓ Admin lists hotel bookings via API Gateway (45ms)
✓ User cancels the booking via API Gateway (98ms)
✓ Verify booking is cancelled via API Gateway (52ms)

Suite Summary: 12 passed, 0 failed (1266ms)

============================================================
SUITE: Business Scenario: Complete Booking Flow via BFF
============================================================
✓ User registers via BFF (155ms)
✓ User logs in via BFF (95ms)
✓ Admin creates hotel via BFF (162ms)
✓ Admin creates room via BFF (138ms)
✓ Check room availability via BFF (82ms)
✓ User creates a booking via BFF (245ms)
...

Suite Summary: 12 passed, 0 failed (1350ms)

...

╔══════════════════════════════════════════════════════════╗
║ TEST SUITE SUMMARY                                       ║
╠══════════════════════════════════════════════════════════╣
║ ✓ Service Health Checks                                  ║
║   Passed: 9 Failed: 0 Duration: 335ms                    ║
║ ✓ User Authentication Flow                               ║
║   Passed: 8 Failed: 0 Duration: 542ms                    ║
║ ✓ Business Scenario: Complete Booking Flow via API GW    ║
║   Passed: 12 Failed: 0 Duration: 1266ms                   ║
║ ✓ Business Scenario: Complete Booking Flow via BFF         ║
║   Passed: 12 Failed: 0 Duration: 1350ms                   ║
║ ✓ Business Scenario: Booking Availability Conflicts        ║
║   Passed: 4 Failed: 0 Duration: 445ms                     ║
...                                                        ║
╠══════════════════════════════════════════════════════════╣
║ Overall: PASSED                                          ║
║ Total Tests: 85                                          ║
║ Passed: 85                                               ║
║ Failed: 0                                                ║
║ Total Duration: 4523ms                                   ║
╚══════════════════════════════════════════════════════════╝
```

## Troubleshooting

### Services Not Starting
```bash
docker-compose logs
docker-compose down && docker-compose up --build
```

### Database Connection Issues
```bash
docker-compose exec hotel-db pg_isready
docker-compose exec user-db pg_isready
docker-compose exec booking-db pg_isready
docker-compose exec booking-db pg_isready -U booking -d booking_db
```

### BFF Service Issues
```bash
docker-compose logs bff-service
docker-compose exec bff-service wget -qO- http://localhost:8080/health
```

### Booking Service Issues
```bash
docker-compose logs booking-service
docker-compose exec booking-service wget -qO- http://localhost:8080/health
docker-compose exec booking-service wget -qO- http://localhost:8080/ready
```

### Test Execution Issues
```bash
# Run with verbose output
npm run test:full

# Run health check first
npm run test:health

# Run specific scenario
npx tsx business-scenarios.ts
```

## File Structure

```
tests/
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── test-config.ts            # Test configuration and env vars
├── test-client.ts            # HTTP client wrapper
├── test-runner.ts            # Test execution engine
├── assertions.ts             # Assertion helpers
├── main-test-suite.ts        # Core test suites
├── business-scenarios.ts     # Business logic scenarios
├── health-check.ts           # Health check script
├── index.ts                  # Main entry point
├── e2e-test-suite.ts         # Alternative test runner
└── README.md                 # This file
```

## API Endpoints Tested

### Via API Gateway (Port 8080) - PRIMARY

#### User Service
- POST `/api/v1/users/register` - Register new user
- POST `/api/v1/users/login` - User login
- GET `/api/v1/users/profile` - Get user profile
- PUT `/api/v1/users/profile` - Update profile

#### Hotel Service
- GET `/api/v1/hotels` - List hotels
- GET `/api/v1/hotels/{id}` - Get hotel by ID
- POST `/api/v1/hotels` - Create hotel (admin)
- PUT `/api/v1/hotels/{id}` - Update hotel (admin)
- DELETE `/api/v1/hotels/{id}` - Delete hotel (admin)
- GET `/api/v1/hotels/{id}/reviews` - List reviews
- POST `/api/v1/hotels/{id}/reviews` - Create review

#### Room Service
- GET `/api/v1/rooms` - List rooms
- GET `/api/v1/rooms/{id}` - Get room by ID
- POST `/api/v1/rooms` - Create room (admin)
- PUT `/api/v1/rooms/{id}` - Update room (admin)
- DELETE `/api/v1/rooms/{id}` - Delete room (admin)
- PATCH `/api/v1/rooms/{id}/quantity` - Update quantity (admin)
- GET `/api/v1/hotels/{hotel_id}/rooms` - List rooms by hotel
- GET `/api/v1/rooms/available` - Check availability

#### Booking Service
- GET `/api/v1/bookings` - List bookings
- GET `/api/v1/bookings/{id}` - Get booking by ID
- POST `/api/v1/bookings` - Create booking
- PUT `/api/v1/bookings/{id}` - Update booking
- PATCH `/api/v1/bookings/{id}/status` - Update status
- PATCH `/api/v1/bookings/{id}/dates` - Update dates
- DELETE `/api/v1/bookings/{id}` - Delete booking
- POST `/api/v1/bookings/{id}/cancel` - Cancel booking
- POST `/api/v1/bookings/{id}/confirm` - Confirm booking
- GET `/api/v1/users/{user_id}/bookings` - Get user bookings
- GET `/api/v1/hotels/{hotel_id}/bookings` - Get hotel bookings
- GET `/api/v1/rooms/{room_id}/bookings` - Get room bookings
- GET `/api/v1/rooms/{room_id}/availability` - Check availability

#### Media Service
- POST `/api/v1/media/upload` - Upload file
- GET `/api/v1/media/download/{bucket}/{key}` - Download file
- GET `/api/v1/media/hotels/{hotel_id}/images` - List hotel images
- GET `/api/v1/media/rooms/{room_id}/images` - List room images

### Via BFF Service (Port 8087) - OPTIONAL

Note: These are convenience endpoints that internally call the API Gateway endpoints above.

#### Auth
- POST `/auth/register` - Register via BFF
- POST `/auth/login` - Login via BFF
- GET `/auth/profile` - Get profile via BFF

#### Hotels
- GET `/hotels` - List hotels
- GET `/hotels/{id}` - Get hotel by ID
- POST `/hotels` - Create hotel (admin)

#### Rooms
- GET `/rooms` - List rooms
- GET `/rooms/{id}` - Get room by ID
- POST `/rooms` - Create room (admin)
- GET `/rooms/{id}/availability` - Check availability

#### Bookings
- GET `/bookings` - List bookings
- GET `/bookings/{id}` - Get booking by ID
- POST `/bookings` - Create booking
- POST `/bookings/{id}/cancel` - Cancel booking
- POST `/bookings/{id}/confirm` - Confirm booking
- GET `/users/{id}/bookings` - User bookings
- GET `/hotels/{id}/bookings` - Hotel bookings

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Use meaningful test names
3. Clean up test data after tests
4. Validate both success and error cases
5. Test cross-service interactions
6. Test via API Gateway first (primary path)
7. Test via BFF second (optional/convenience path)
8. Update this README with new scenarios
