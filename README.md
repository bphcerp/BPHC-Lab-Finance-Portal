# Finance Lab Portal

## _Please READ THIS before you make ANY changes to this repository_

## Labs Currently using this portal:
###  1. LAMBDA - https://portal.lambda-india.com/
###  2. Nano Scale Devices Lab - https://inventory.nsdlab.org/ 

## CI/CD
-  The organisation this project is under (bphcerp) has two runners available as of when this README file was written.
- This project uses the `eee-ims` runner to clone and update the code on the oracle compute instance
- Two seperate jobs are configured in the pipeline.yml file for the two labs. If you need to add more refer to [this](#steps-to-add-another-lab)

---

> 🚫 **Do not commit directly to main. Always create a branch and open a pull request for review.**

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
    sudo docker exec -it <server-container-name> pnpm db:seed <your_email> Admin|Viewer
    ```
    or
    ```bash
    cd backend
    pnpm db:seed: <your_email> Admin|Viewer host
    ```

---

## Notes
- The containers use the ports specified in the `.env` file.
- The Google OAuth clients are configured under the bphcerp@gmail.com account under the `Finance-Portal-EEE` project
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


## Steps to add another lab

- Make a new folder in the OCI server with the format `<shortlabname>-finance`
- Clone the repository into this folder with this command
    ```
    git clone https://github.com/bphcerp/BPHC-Lab-Finance-Portal.git <shortlabname>-finance

    # dont forget to replace the directory placeholder with the actual name
    ```
- Copy the .env.example file to .env and change the relevant variables
    ```
    MONGO_HOST=localhost

    MONGO_PORT=27017 # change this if 27017 is not available on the host machine

    MONGO_DB=lambda # change this to whatever the lab name is

    MONGO_USER=<user>

    MONGO_PASSWORD=<password> # change this to something strong

    FRONTEND_URL=http://localhost:5173 # change this to the frontend domain
    JWT_SECRET_KEY=jwt_secret_should_be_atleast_256_bits_long

    SERVER_PORT=4000 # change this to whatever is available

    VITE_BACKEND_URL=http://localhost:4000/api # this will be /api in the production if you configure caddy the way it's configured right now

    VITE_OAUTH_CID=<replace the production google oauth here>

    CLIENT_PORT=5173 # change this to whatever is available

    VITE_LAB_NAME="LAMBDA Lab" # change this to the lab's name

    VITE_LOGO_AVAILABLE=true # to show logo.png or text in the header of the application
    ```

