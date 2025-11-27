# CaseFlow

CaseFlow is a high-performance import workflow system built with Next.js 16, Prisma, and PostgreSQL.

## Local Development (One Command)

The easiest way to start the application locally is using Docker Compose. This will start the PostgreSQL database and the Next.js application in development mode (simulated).

```bash
# Start everything
docker compose up --build

# The app will be available at http://localhost:3000
```
That URL http://3edcae97c506:3000 is showing the internal Docker container ID as the hostname. This is completely normal behavior for Next.js running inside a container.

Inside Docker: The app sees itself as 3edcae97c506 (the container ID).
Outside (Your Browser): You access it via http://localhost:3000 because of the ports: - "3000:3000" mapping in docker-compose.yml.
The UntrustedHost error you saw earlier should be fixed now that AUTH_TRUST_HOST: "true" is in your config. You can safely ignore the internal URL in the logs.

If you want the logs to say localhost, you can add HOSTNAME: "0.0.0.0" to the environment section in docker-compose.yml, but it's purely cosmetic

### Manual Setup

If you prefer to run the application manually:

1.  Install dependencies:

    ```bash
    pnpm install
    ```

2.  Start the database (ensure you have a local Postgres running or use Docker for just the DB):

    ```bash
    docker compose up postgres -d
    ```

3.  Generate Prisma Client:

    ```bash
    pnpm db:generate
    ```

4.  Start the development server:
    ```bash
    pnpm dev
    ```

## CI/CD

This project uses GitHub Actions for CI/CD. The workflow is defined in `.github/workflows/ci.yml` and includes:

- Linting
- Type Checking
- Build Verification
- Caching for faster builds
