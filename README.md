# Hotel Microservices Infrastructure

This directory contains the Docker Compose configuration and infrastructure setup for the Hotel Microservices platform.

## Architecture Overview

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
└──────┬───────┘          └───────┬──────────┘          └───────┬──────────┘
       │                          │                           │
       │                          │                           │
       │                          ▼                           ▼
       │                   ┌──────────────┐            ┌──────────────┐
       │                   │ Media Client │            │ Media Client │
       │                   └──────┬───────┘            └──────┬───────┘
       │                          │                           │
       │                          ▼                           ▼
       │                   ┌──────────────┐            ┌──────────────┐
       │                   │  Media Service│           │ (same)       │
       │                   │  (8082)       │           └──────────────┘
       │                   └──────┬───────┘
       │                          │
       │                   ┌──────▼──────┐
       │                   │   MinIO    │
       │                   │  (9000)    │
       │                   └─────────────┘
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
└──────┬────────────────────────────────────────────────────────────────────┘
       │
       │
┌──────▼──────────┐
│  booking-db     │
│  (Postgres 5437)│
└─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     BFF Service (8087) - Optional                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Backend for Frontend - Aggregates calls to Hotel, Room, Booking services   │
│ for frontend convenience. All services remain directly accessible via API │
│ Gateway.                                                                    │
│                                                                             │
│ Note: BFF does NOT isolate services from API Gateway. All services are    │
│ accessible both via API Gateway AND via BFF.                                │
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

## Services

| Service | Port | Database | DB Port | Description |
|---------|------|----------|---------|-------------|
| API Gateway | 8080 | - | - | Routes requests to microservices |
| BFF Service | 8087 | - | - | Optional: Aggregates hotel, room, booking, media for frontend |
| User Service | 8081 | user-db | 5433 | Authentication & user management |
| Media Service | 8082 | media-db | 5434 | File uploads & downloads |
| Hotel Service | 8084 | hotel-db | 5435 | Hotel CRUD, reviews, ratings. Direct media access |
| Room Service | 8085 | rooms-db | 5436 | Room management & availability. Direct media access |
| Booking Service | 8086 | booking-db | 5437 | Booking management & reservations |
| MinIO | 9000/9001 | - | - | S3-compatible object storage |

## Quick Start

### Prerequisites

- Docker Desktop 4.0+ or Docker Engine 20.10+
- Docker Compose v2.0+
- 8GB RAM minimum

### Start All Services

```bash
cd Infra
docker-compose up --build
```

### Start Specific Services

```bash
# Start with detached mode
docker-compose up -d

# Scale specific service
docker-compose up -d --scale booking-service=2

# Start with rebuild
docker-compose up --build --force-recreate
```

### Stop All Services

```bash
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database Users & Passwords
USER_DB_USER=user
USER_DB_PASSWORD=your_secure_password

HOTEL_DB_USER=hotel
HOTEL_DB_PASSWORD=your_secure_password

ROOMS_DB_USER=rooms
ROOMS_DB_PASSWORD=your_secure_password

BOOKING_DB_USER=booking
BOOKING_DB_PASSWORD=your_secure_password

MEDIA_DB_USER=media
MEDIA_DB_PASSWORD=your_secure_password

# MinIO Credentials
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio_secret_key

# Test Credentials
ADMIN_EMAIL=admin@hotel.com
ADMIN_PASSWORD=Admin123!
USER_EMAIL=user@hotel.com
USER_PASSWORD=User123!
```

## Health Checks

All services include health checks:

```bash
# Check all services
docker-compose ps

# Check specific service health
docker-compose exec user-service wget -qO- http://localhost:8081/health
docker-compose exec hotel-service wget -qO- http://localhost:8080/health
docker-compose exec booking-service wget -qO- http://localhost:8080/health

# View logs
docker-compose logs -f booking-service
docker-compose logs -f bff-service
```

## Database Migrations

Migrations run automatically on service startup. To manually trigger:

```bash
# Run migrations for booking service
docker-compose exec booking-service ./api migrate

# Access database directly
docker-compose exec booking-db psql -U booking -d booking_db
```

## API Endpoints

### Via API Gateway (Port 8080) - RECOMMENDED

```
# Users
POST   /api/v1/users/register
POST   /api/v1/users/login
GET    /api/v1/users/profile

# Hotels (Direct access)
GET    /api/v1/hotels
GET    /api/v1/hotels/{id}
POST   /api/v1/hotels
PUT    /api/v1/hotels/{id}
DELETE /api/v1/hotels/{id}
GET    /api/v1/hotels/{id}/reviews
POST   /api/v1/hotels/{id}/reviews

# Rooms (Direct access)
GET    /api/v1/rooms
GET    /api/v1/rooms/{id}
POST   /api/v1/rooms
PUT    /api/v1/rooms/{id}
DELETE /api/v1/rooms/{id}
GET    /api/v1/hotels/{hotel_id}/rooms
GET    /api/v1/rooms/available

# Bookings (Direct access)
GET    /api/v1/bookings
GET    /api/v1/bookings/{id}
POST   /api/v1/bookings
PUT    /api/v1/bookings/{id}
PATCH  /api/v1/bookings/{id}/status
POST   /api/v1/bookings/{id}/cancel
POST   /api/v1/bookings/{id}/confirm
GET    /api/v1/users/{user_id}/bookings
GET    /api/v1/hotels/{hotel_id}/bookings
GET    /api/v1/rooms/{room_id}/bookings

# Media
POST   /api/v1/media/upload
GET    /api/v1/media/download/{bucket}/{key}
GET    /api/v1/media/hotels/{hotel_id}/images
GET    /api/v1/media/rooms/{room_id}/images
```

### Via BFF Service (Port 8087) - OPTIONAL

Note: These are convenience endpoints that internally call the direct service APIs above.

```
# Auth
POST   /auth/register
POST   /auth/login
GET    /auth/profile

# Hotels (aggregated with rooms)
GET    /hotels
GET    /hotels/{id}
POST   /hotels (admin only)

# Rooms
GET    /rooms
GET    /rooms/{id}
POST   /rooms (admin only)
GET    /rooms/{id}/availability

# Bookings
GET    /bookings
GET    /bookings/{id}
POST   /bookings
POST   /bookings/{id}/cancel
POST   /bookings/{id}/confirm
GET    /users/{id}/bookings
GET    /hotels/{id}/bookings
```

## Testing

See `tests/README.md` for comprehensive test suite documentation.

```bash
cd tests
npm install
npm run test
```

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose logs

# Restart with clean slate
docker-compose down -v
docker-compose up --build
```

### Database Connection Issues

```bash
# Check database is ready
docker-compose exec booking-db pg_isready -U booking -d booking_db
docker-compose exec hotel-db pg_isready -U hotel -d hotel_db

# View database logs
docker-compose logs booking-db
```

### Port Conflicts

If ports are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "8086:8080"  # Change first number to available port
```

### JWT Key Issues

Ensure JWT keys are in the `keys/` directory:

```bash
mkdir -p keys
# Copy your public.pem and private.pem files here
```

## Data Persistence

Data is persisted using Docker volumes:

- `user-db-data` - User service database
- `hotel-db-data` - Hotel service database
- `rooms-db-data` - Room service database
- `booking-db-data` - Booking service database
- `media-db-data` - Media service database
- `minio_data` - MinIO object storage

To backup data:

```bash
docker-compose exec booking-db pg_dump -U booking booking_db > backup.sql
```

To restore:

```bash
docker-compose exec -T booking-db psql -U booking booking_db < backup.sql
```

## Development Mode

For local development with hot reload:

```bash
# Start infrastructure only
docker-compose up -d user-db hotel-db rooms-db booking-db media-db minio

# Run services locally
cd ../BookingMicroService
go run ./app/cmd/api/main.go
```

## Production Considerations

1. **Security**: Change all default passwords in `.env`
2. **SSL/TLS**: Use reverse proxy (nginx/traefik) for HTTPS
3. **Monitoring**: Add Prometheus/Grafana for metrics
4. **Scaling**: Use Docker Swarm or Kubernetes for orchestration
5. **Backups**: Schedule regular database backups
6. **Secrets**: Use Docker Secrets or external secret management

## License

MIT License - See main project LICENSE file
