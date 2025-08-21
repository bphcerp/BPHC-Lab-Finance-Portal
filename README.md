# LAMBDA Lab Portal

> 🚫 **Do not commit directly to main. Always use a feature branch and open a pull request for review.**

## Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [pnpm](https://pnpm.io/installation)

### Setup Steps

1. **Install dependencies**
    ```bash
    pnpm i -r
    ```

2. **Copy environment variables template**
    ```bash
    cp .env.example .env
    ```

3. **Start Docker containers**
    - For development:
        ```bash
        docker compose --profile dev up --build
        ```
    - For production:
        ```bash
        docker compose --profile prod up --build
        ```

4. **Seed the database** (in a new terminal):
    ```bash
    cd backend
    pnpm db:seed <your_email>
    ```

---

## Notes
- The containers use the ports specified in the `.env` file.
- Make sure Docker is running before starting the containers.
- For any issues, check the logs of the respective service using Docker.
            ```
    - **Note: this is only for development. Add the appropriate URL in the production environment.**

## Oracle Compute Configuration

- The production server is hosted on `Oracle Cloud Infrastructure Compute Instance`

> For the account credentials and SSH keys, contact the project administrator.

>**THIS IS A PRODUCTION SERVER!!! DONOT MODIFY ANY FILES ONCE LOGGED IN. ALWAYS CONSULT THE TEAM BEFORE TAKING ANY IRREVERSIBLE DECISION ON THE SERVER**

- The SSL Certification and HTTP->HTTPS forwarding is taken care by caddy (Check `Caddyfile` for more information)

- This file is just for reference, the actual file should be set at `/etc/caddy/Caddyfile`


