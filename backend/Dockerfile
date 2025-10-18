# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Working directory
WORKDIR /app

# Install system dependencies
# Install system dependencies needed for building some packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY pyproject.toml setup.cfg setup.py* /app/
COPY app /app/app

# Install project in editable mode (or normal) so dependencies from pyproject are installed
RUN pip install --no-cache-dir .

# Cloud Run expects the service to listen on the port defined by $PORT
ENV PORT 8080
EXPOSE ${PORT}

# Use uvicorn with gunicorn's uvicorn worker for production
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8080", "--workers", "1"]
