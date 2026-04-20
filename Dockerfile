# Stage 1: Build the React frontend
FROM node:20-slim AS frontend

WORKDIR /app
# Copy only the package.json and lockfile first to cache dependencies
COPY my-react/package*.json ./my-react/

WORKDIR /app/my-react
RUN npm install

# Copy the rest of the React source code and build
COPY my-react/ ./
RUN npm run build


# Stage 2: Build the Python Flask backend and serve
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required by typical Python packages like Qiskit
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies file and install
COPY backend/requirements.txt ./backend/
WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the python backend
COPY backend/ ./

# Copy the built React assets from the earlier stage
COPY --from=frontend /app/my-react/dist /app/my-react/dist

# Expose the standard port (Railway injects $PORT at runtime, usually 5000 but dynamic)
ENV PORT="5000"
EXPOSE ${PORT}

# Run the Gunicorn production server
CMD gunicorn -w 1 -b 0.0.0.0:$PORT app:app --timeout 120
