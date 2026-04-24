# Hotel Microservices Integration Test Suite

End-to-end integration testing suite for the Hotel Microservices platform. This test suite validates all service endpoints by simulating realistic application flows rather than isolated unit tests.

## Architecture

The test suite validates the following services defined in the `docker-compose.yml`:

```
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway (8080)                          │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  User Service    │  │  Hotel Service   │  │  Media Service   │
│     (8081)       │  │     (8084)       │  │     (8082)       │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ - Register       │  │ - CRUD Hotels    │  │ - Upload Files   │
│ - Login          │  │ - Reviews        │  │ - Download Files │
│ - Profile        │  │ - Ratings        │  │ - List Images    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   user-db        │  │   hotel-db       │  │   media-db       │
│   (Postgres)     │  │   (Postgres)     │  │   (Postgres)     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                        │
                        ▼
┌──────────────────────────────────┐
│      Room Service (8085)         │
├──────────────────────────────────┤
│ - CRUD Rooms                     │
│ - Availability Check             │
│ - Hotel-Room Relationships       │
└──────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│    MinIO Service (9000/9001)     │
│ - S3-compatible Storage          │
│ - Media Asset Management         │
└──────────────────────────────────┘
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

### 4. Media Service Integration
- Upload hotel images
- List hotel images
- Download media files
- Media-room associations

### 5. Room Service Integration
- Create rooms for hotels
- List rooms by hotel
- Room availability checks
- Update room details
- Manage room inventory

### 6. Review Operations
- Create reviews (authenticated users)
- List reviews by hotel
- Hotel rating updates
- Review validation

### 7. Cross-Service Data Integrity
- Media linked to hotels
- Rooms linked to hotels
- Reviews linked to hotels
- Data consistency across services

### 8. Authorization & Security
- Role-based access control
- Admin-only operations
- Unauthorized access prevention
- Token validation

### 9. Business Logic Scenarios
- Hotel booking flow
- Admin hotel management
- Guest review flow
- Room availability checks
- Media asset management

## Installation

```bash
cd Infra/tests
npm install
```

## Configuration

The test suite uses environment variables defined in `../.env`. You can override them by creating a `.env` file in the tests directory:

```bash
# Service URLs
API_GATEWAY_URL=http://localhost:8080
USER_SERVICE_URL=http://localhost:8081
MEDIA_SERVICE_URL=http://localhost:8082
HOTEL_SERVICE_URL=http://localhost:8084
ROOM_SERVICE_URL=http://localhost:8085

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
   - Media uploads
   - Review system

4. **Integration Validation**
   - Cross-service data consistency
   - Media service integration
   - Foreign key relationships

5. **Security Testing**
   - Unauthorized access
   - Permission validation
   - Token expiration

6. **Cleanup**
   - Remove test data
   - Reset state

## Real-World Scenarios Tested

### Scenario 1: Hotel Booking Flow
A user registers, browses hotels, checks room availability, and creates reviews.

### Scenario 2: Admin Hotel Management
An admin creates a hotel, adds rooms with media, and manages inventory.

### Scenario 3: Guest Review Flow
A guest stays at a hotel and leaves a review that updates the hotel's rating.

### Scenario 4: Room Availability
Checking room availability for specific dates and guest counts.

### Scenario 5: Media Asset Management
Hotels and rooms have associated images uploaded through the media service.

## Data Flow

```
User Registration/Login
        │
        ▼
┌──────────────────┐
│  Get JWT Token   │
└──────────────────┘
        │
        ├─────────────┬─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Create Hotel │ │List Hotels│ │Get Hotel │ │  Review  │
│   (Admin)    │ │          │ │   by ID  │ │  Hotel   │
└──────────────┘ └──────────┘ └──────────┘ └──────────┘
        │
        ▼
┌──────────────┐
│ Upload Media │───► MinIO Storage
│  (Images)    │
└──────────────┘
        │
        ▼
┌──────────────┐
│ Create Rooms │
│  (Admin)     │
└──────────────┘
        │
        ▼
┌──────────────┐
│ Check Avail. │
│  (Guest)     │
└──────────────┘
```

## Output Format

Tests output a detailed report:

```
╔══════════════════════════════════════════════════════════╗
║     End-to-End Integration Test Suite                    ║
║     Hotel Microservices Platform                         ║
╚══════════════════════════════════════════════════════════╝

============================================================
  SUITE: Service Health Checks
============================================================
  ✓ User Service health endpoint (45ms)
  ✓ Hotel Service health endpoint (32ms)
  ✓ Media Service health endpoint (28ms)
  ✓ Room Service health endpoint (30ms)
  ✓ User Service readiness check (102ms)
  ✓ Hotel Service readiness check (98ms)

  Suite Summary: 6 passed, 0 failed (335ms)

...

╔══════════════════════════════════════════════════════════╗
║  TEST SUITE SUMMARY                                      ║
╠══════════════════════════════════════════════════════════╣
║ ✓ Service Health Checks                                   ║
║   Passed:   6 Failed: 0   Duration:   335ms              ║
║ ✓ User Authentication Flow                                ║
║   Passed:   8 Failed: 0   Duration:   542ms              ║
...
╠══════════════════════════════════════════════════════════╣
║ Overall: PASSED                                           ║
║ Total Tests: 67                                           ║
║ Passed: 67                                                ║
║ Failed: 0                                                 ║
║ Total Duration: 4523ms                                    ║
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
docker-compose exec media-db pg_isready
```

### MinIO Issues
```bash
docker-compose logs minio
docker-compose logs minio-init
```

### Test Execution Issues
```bash
# Run with verbose output
npm run test:full

# Run health check first
npm run test:health
```

## File Structure

```
tests/
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── test-config.ts         # Test configuration and env vars
├── test-client.ts         # HTTP client wrapper
├── test-runner.ts         # Test execution engine
├── assertions.ts          # Assertion helpers
├── main-test-suite.ts     # Core test suites
├── business-scenarios.ts  # Business logic scenarios
├── health-check.ts        # Health check script
├── index.ts               # Main entry point
├── e2e-test-suite.ts      # Alternative test runner
└── README.md              # This file
```

## API Endpoints Tested

### User Service (8081)
- POST `/register` - Register new user
- POST `/login` - User login
- GET `/profile` - Get user profile
- PUT `/profile` - Update profile

### Hotel Service (8084)
- GET `/hotels` - List hotels
- GET `/hotels/{id}` - Get hotel by ID
- POST `/hotels` - Create hotel (admin)
- PUT `/hotels/{id}` - Update hotel (admin)
- DELETE `/hotels/{id}` - Delete hotel (admin)
- GET `/hotels/{id}/reviews` - List reviews
- POST `/hotels/{id}/reviews` - Create review

### Media Service (8082)
- POST `/upload` - Upload file
- GET `/download/{bucket}/{key}` - Download file
- GET `/hotels/{hotel_id}/images` - List hotel images
- GET `/rooms/{room_id}/images` - List room images

### Room Service (8085)
- GET `/rooms` - List rooms
- GET `/rooms/{id}` - Get room by ID
- POST `/rooms` - Create room (admin)
- PUT `/rooms/{id}` - Update room (admin)
- DELETE `/rooms/{id}` - Delete room (admin)
- PATCH `/rooms/{id}/quantity` - Update quantity (admin)
- GET `/hotels/{hotel_id}/rooms` - List rooms by hotel
- GET `/rooms/available` - Check availability

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Use meaningful test names
3. Clean up test data after tests
4. Validate both success and error cases
5. Test cross-service interactions
