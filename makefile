FRONTEND_DIR := frontend
BACKEND_DIR := backend
IMAGE_NAME ?= owners-party-race-ranking
GCP_PROJECT ?= owners-party-race-ranking
GCP_REGION ?= asia-northeast3

.PHONY: frontend-build frontend-deploy backend-build backend-deploy

frontend-build:
	cd $(FRONTEND_DIR) && npm run build

frontend-deploy: frontend-build
	cd $(FRONTEND_DIR) && firebase deploy --only hosting

backend-build:
	gcloud builds submit $(BACKEND_DIR) --tag gcr.io/$(GCP_PROJECT)/$(IMAGE_NAME)

backend-deploy: backend-build
	gcloud run deploy $(IMAGE_NAME) --image gcr.io/$(GCP_PROJECT)/$(IMAGE_NAME) --platform managed --region $(GCP_REGION) --allow-unauthenticated
