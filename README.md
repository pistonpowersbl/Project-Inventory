# Project Inventory

A full-stack inventory management application with React frontend and Node.js backend.

## Prerequisites

- Docker
- Docker Compose
- Git

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd project-inventory
```

2. Start the application:
```bash
docker-compose up
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Development

### Frontend
- Located in `frontend/` directory
- Built with React
- Runs on port 3000

### Backend
- Located in `backend/` directory
- Node.js with Express
- PostgreSQL database
- Runs on port 5000

### Database
- PostgreSQL 15
- Default credentials:
  - Database: inventorydb
  - Username: inventory_app
  - Password: NotaGoodOne!@3965

## Contributing

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes

3. Commit your changes:
```bash
git add .
git commit -m "Description of your changes"
```

4. Push to the branch:
```bash
git push origin feature/your-feature-name
```

5. Create a Pull Request

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```
DB_USER=inventory_app
DB_PASSWORD=NotaGoodOne!@3965
DB_HOST=postgres
DB_PORT=5432
DB_NAME=inventorydb
``` 