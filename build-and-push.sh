#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;36m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
PROJECT_NAME="fractalis"
COMPONENT="frontend"
REGION="us-central1"
REPOSITORY="proyectos-desarrollo"

# URLs de producción (embebidas en el JS durante el build)
API_URL="https://api.fractalis.dedalus.cl"
GRAPHQL_URL="https://api.fractalis.dedalus.cl/graphql"

VERSION=${1:-"latest"}

if [ "$VERSION" == "latest" ]; then
  echo -e "${RED}⚠️  WARNING: Using 'latest' tag is not recommended for production${NC}"
  echo -e "${BLUE}💡 Usage: ./build-and-push.sh v1.0.0${NC}"
  read -p "Continue with 'latest'? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${PROJECT_NAME}/${COMPONENT}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔨 Building ${PROJECT_NAME}/${COMPONENT}:${VERSION}${NC}"
echo -e "${BLUE}📦 Project: ${PROJECT_ID}${NC}"
echo -e "${BLUE}🌎 NEXT_PUBLIC_API_URL: ${API_URL}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${GREEN}🏗️  Building Frontend (no cache)...${NC}"
docker build --no-cache \
  --build-arg NEXT_PUBLIC_API_URL=${API_URL} \
  --build-arg NEXT_PUBLIC_GRAPHQL_URL=${GRAPHQL_URL} \
  -t ${IMAGE_URL}:${VERSION} \
  -t ${IMAGE_URL}:latest \
  .

echo -e "\n${GREEN}📤 Pushing to Artifact Registry...${NC}"
docker push ${IMAGE_URL}:${VERSION}
docker push ${IMAGE_URL}:latest

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Frontend image pushed successfully!${NC}"
echo -e "${BLUE}🔒 NEXT_PUBLIC_API_URL embebida: ${API_URL}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "  1. SSH to VM: ${BLUE}gcloud compute ssh fractalis-vm --zone=us-central1-a${NC}"
echo -e "  2. Deploy:    ${BLUE}cd /opt/proyectos/fractalis && docker compose pull && docker compose up -d${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
