#!/bin/bash
set -e

SERVICE="${1:-backend}"
IMAGE="${2}"
TAG="${3:-latest}"

DEPLOY_DIR="/opt/mitbiz-deploy"
ENV_FILE="${DEPLOY_DIR}/env_vars/${SERVICE}.env"
DATA_DIR="${DEPLOY_DIR}/data"
CONTAINER_NAME="mitbiz-${SERVICE}"

echo "=== Deploying ${SERVICE} ==="
echo "Image: ${IMAGE}:${TAG}"

if [ -z "${IMAGE}" ]; then
    echo "Error: IMAGE not provided"
    exit 1
fi

# Ensure data directory exists with proper permissions
mkdir -p "${DATA_DIR}/backend-uploads"
mkdir -p "${DATA_DIR}/frontend-uploads"
mkdir -p "${DATA_DIR}/backend-uploads/tenants"
chmod -R 777 "${DATA_DIR}"

echo "Pulling image..."
docker pull "${IMAGE}:${TAG}"

echo "Stopping existing container..."
docker stop "${CONTAINER_NAME}" 2>/dev/null || true
docker rm "${CONTAINER_NAME}" 2>/dev/null || true

echo "Starting new container..."
if [ -f "${ENV_FILE}" ]; then
    if [ "${SERVICE}" == "backend" ]; then
        docker run -d \
            --name "${CONTAINER_NAME}" \
            --restart unless-stopped \
            --env-file "${ENV_FILE}" \
            -v "${DATA_DIR}/backend-uploads:/app/uploads" \
            -p 3001:3001 \
            "${IMAGE}:${TAG}"
    else
        docker run -d \
            --name "${CONTAINER_NAME}" \
            --restart unless-stopped \
            --env-file "${ENV_FILE}" \
            -v "${DATA_DIR}/frontend-uploads:/app/uploads" \
            -p 8080:8080 \
            "${IMAGE}:${TAG}"
    fi
else
    echo "Warning: ${ENV_FILE} not found, running without env file"
    if [ "${SERVICE}" == "backend" ]; then
        docker run -d \
            --name "${CONTAINER_NAME}" \
            --restart unless-stopped \
            -v "${DATA_DIR}/backend-uploads:/app/uploads" \
            -p 3001:3001 \
            "${IMAGE}:${TAG}"
    else
        docker run -d \
            --name "${CONTAINER_NAME}" \
            --restart unless-stopped \
            -v "${DATA_DIR}/frontend-uploads:/app/uploads" \
            -p 8080:8080 \
            "${IMAGE}:${TAG}"
    fi
fi

echo "Cleaning up old images..."
docker image prune -f

echo "=== ${SERVICE} deployed successfully ==="
docker ps --filter "name=${CONTAINER_NAME}"
