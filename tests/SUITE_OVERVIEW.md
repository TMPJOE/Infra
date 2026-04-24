# Test Suite Overview

This document provides an overview of the comprehensive end-to-end integration testing suite for the Hotel Microservices platform.

## Test Suite Architecture

```
tests/
├── index.ts                  # Main entry point
├── main-test-suite.ts        # Core test functions
├── business-scenarios.ts     # Business logic scenarios
├── config-validation.ts      # Configuration validation
├── test-client.ts            # HTTP client wrapper
├── test-runner.ts            # Test execution engine
├── test-reporter.ts          # Report generation
├── assertions.ts             # Assertion helpers
├── health-check.ts           # Standalone health check
├── test-config.ts            # Configuration
├── run-tests.ps1             # PowerShell runner
├── install.ps1 / install.sh  # Installation scripts
└── README.md                 # Documentation
```

## Test Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Configuration Validation                          │
│  ├─ Docker Compose Config Validation                        │
│  ├─ Environment Config                                      │
│  ├─ Service Communication                                   │
│  └─ Endpoint Availability                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: Infrastructure Tests                              │
│  └─ Service Health Checks                                   │
│     ├─ User Service Health                                  │
│     ├─ Hotel Service Health                                 │
│     ├─ Media Service Health                                 │
│     ├─ Room Service Health                                  │
│     └─ Database Readiness                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: Core Functionality Tests                          │
│  ├─ User Authentication                                     │
│  │  ├─ Register Admin/User                                   │
│  │  ├─ Login                                                 │
│  │  └─ Token Validation                                      │
│  ├─ Hotel CRUD Operations                                   │
│  │  ├─ Create/Read/Update/Delete Hotels                     │
│  │  └─ List with Filters                                     │
│  ├─ Media Operations                                        │
│  │  ├─ Upload Files                                          │
│  │  ├─ List Images                                           │
│  │  └─ Download Files                                        │
│  ├─ Room Operations                                         │
│  │  ├─ Create/Read/Update/Delete Rooms                      │
│  │  ├─ Check Availability                                    │
│  │  └─ Manage Inventory                                      │
│  └─ Review Operations                                       │
│     ├─ Create Reviews                                        │
│     └─ List Reviews                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: Integration Tests                                 │
│  ├─ Cross-Service Data Integrity                            │
│  │  ├─ Media ↔ Hotels                                       │
│  │  ├─ Rooms ↔ Hotels                                       │
│  │  └─ Reviews ↔ Hotels                                     │
│  └─ Authorization & Security                                │
│     ├─ Role-Based Access Control                            │
│     └─ Token Validation                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 5: Business Logic Scenarios                          │
│  ├─ Hotel Booking Flow                                      │
│  ├─ Admin Hotel Management                                  │
│  ├─ Guest Review Flow                                       │
│  ├─ Room Availability Flow                                  │
│  └─ Media Asset Management                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 6: Cleanup                                           │
│  ├─ Delete Test Rooms                                       │
│  └─ Delete Test Hotels                                      │
└─────────────────────────────────────────────────────────────┘
```

## Test Suites Detail

### 1. Configuration Validation (config-validation.ts)
- **DockerComposeConfig**: Validates docker-compose.yml services are running
- **EnvironmentConfig**: Validates environment variables
- **ServiceCommunication**: Tests inter-service connectivity
- **EndpointAvailability**: Verifies all endpoints are accessible

### 2. Service Health (main-test-suite.ts)
- **testServiceHealth**: Health and readiness checks for all services

### 3. User Authentication (main-test-suite.ts)
- **testUserAuthentication**: Registration, login, token validation

### 4. Hotel Operations (main-test-suite.ts)
- **testHotelOperations**: CRUD operations, filtering

### 5. Media Operations (main-test-suite.ts)
- **testMediaOperations**: Upload, list, download media

### 6. Room Operations (main-test-suite.ts)
- **testRoomOperations**: Room CRUD, availability, inventory

### 7. Review Operations (main-test-suite.ts)
- **testReviewOperations**: Create and list reviews

### 8. Data Integrity (main-test-suite.ts)
- **testDataIntegrity**: Cross-service data consistency

### 9. Authorization (main-test-suite.ts)
- **testAuthorization**: RBAC, unauthorized access prevention

### 10. Business Scenarios (business-scenarios.ts)
- **Hotel Booking Flow**: User registration → browse → review
- **Admin Management**: Hotel/room management with media
- **Guest Review Flow**: Stay → review workflow
- **Room Availability**: Date-based availability checks
- **Media Management**: Asset lifecycle
- **Error Handling**: Edge cases and validation

## Service Endpoints Tested

### User Service (Port 8081)
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /health | GET | No | Health check |
| /ready | GET | No | Readiness check |
| /register | POST | No | Register user |
| /login | POST | No | User login |
| /profile | GET/PUT | Yes | Profile management |

### Hotel Service (Port 8084)
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /health | GET | No | Health check |
| /ready | GET | No | Readiness check |
| /hotels | GET/POST | Mixed | List/Create hotels |
| /hotels/{id} | GET/PUT/DELETE | Mixed | Hotel CRUD |
| /hotels/{id}/reviews | GET/POST | Mixed | Review operations |

### Media Service (Port 8082)
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /health | GET | No | Health check |
| /ready | GET | No | Readiness check |
| /upload | POST | Yes | Upload file |
| /download/{bucket}/{key} | GET | Yes | Download file |
| /hotels/{id}/images | GET | Yes | List hotel images |
| /rooms/{id}/images | GET | Yes | List room images |

### Room Service (Port 8085)
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /health | GET | No | Health check |
| /ready | GET | No | Readiness check |
| /rooms | GET/POST | Mixed | List/Create rooms |
| /rooms/{id} | GET/PUT/DELETE | Mixed | Room CRUD |
| /rooms/{id}/quantity | PATCH | Yes | Update quantity |
| /hotels/{id}/rooms | GET | No | List by hotel |
| /rooms/available | GET | No | Check availability |

## Data Flow Validation

The test suite validates the following data flows:

1. **User → Hotel Creation**
   ```
   Register → Login → Create Hotel → Upload Media → Create Rooms
   ```

2. **Hotel → Media Association**
   ```
   Create Hotel → Upload Images → List Images → Download
   ```

3. **Hotel → Room Relationship**
   ```
   Create Hotel → Create Rooms → List by Hotel → Check Availability
   ```

4. **User → Review → Hotel Rating**
   ```
   Create Hotel → Create Review → List Reviews → Verify Rating Update
   ```

5. **Cross-Service Integrity**
   ```
   Hotel ID exists in: Hotel Service, Media Service, Room Service, Reviews
   ```

## Running the Tests

### Full Test Suite
```bash
cd Infra/tests
npm run test
```

### Health Checks Only
```bash
npm run test:health
```

### Business Scenarios
```bash
npm run test:business
```

### With Docker Compose
```bash
# From Infra directory
docker-compose up --build

# Then run tests
cd tests
npm run test
```

## Test Reports

The test suite generates reports in multiple formats:
- **Console**: Real-time output during execution
- **JSON**: Machine-readable format
- **HTML**: Visual report with styling
- **Markdown**: Documentation-friendly format

## Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed

## Environment Variables

Configure in `.env` or environment:

```bash
# Service URLs
API_GATEWAY_URL=http://localhost:8080
USER_SERVICE_URL=http://localhost:8081
MEDIA_SERVICE_URL=http://localhost:8082
HOTEL_SERVICE_URL=http://localhost:8084
ROOM_SERVICE_URL=http://localhost:8085

# Credentials
ADMIN_EMAIL=admin@hotel.com
ADMIN_PASSWORD=Admin123!
USER_EMAIL=user@hotel.com
USER_PASSWORD=User123!

# Timeouts
REQUEST_TIMEOUT=30000
HEALTHY_TIMEOUT=120000
```

## Integration with CI/CD

```yaml
# Example GitHub Actions
- name: Run Integration Tests
  run: |
    cd Infra/tests
    npm install
    npm run test
  env:
    API_GATEWAY_URL: http://localhost:8080
    USER_SERVICE_URL: http://localhost:8081
    # ... other env vars
```
