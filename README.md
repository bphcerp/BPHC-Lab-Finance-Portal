# LAMBDA Inventory Portal

## Steps to get the software running on your machine:

- ### Install Docker
    - Mac/Windows : Install Docker Desktop
    - Linux : Install Docker and Docker-Compose separately

- ### Keep Docker Running
    - Mac/Windows : Run Docker Desktop and Add it to Startup Apps
    - Linux :

        ```bash
        sudo systemctl start docker && sudo systemctl enable docker
        ```

        <!-- Has to be modified, not verified if its right -->

- ### Set up the Environment variables
    - Make a .env file in the backend and frontend
    - #### Frontend:
        - Add this to the env file
            ```env
            VITE_BACKEND_URL=http://localhost:3000/api
            ```
    - #### Backend:
        - Add these to the env file
            ```env
            FRONTEND_URL= http://localhost:5173 
            DB_URI=mongodb://mongo:27017/<database_name>
            JWT_SECRET_KEY=<some_random_string>
            PORT=3000
            ```
    - **Note: this is only for development. Add the appropriate URL in the production environment.**

- ### Run the project
    - Ensure docker is running
    - In the root directory run this command:
        ```bash
        docker-compose up
        ```
    - If you have installed this code before and want to update it with a newer version, run this command
        ```bash
        docker-compose up --build --force-recreate
        ```
