FRONTEND_DIR := frontend
BACKEND_DIR := backend
FRONTEND_IMAGE_NAME ?= owners-party-race-ranking-frontend
FRONTEND_SERVICE_NAME ?= owners-party-race-ranking-frontend
IMAGE_NAME ?= owners-party-race-ranking
GCP_PROJECT ?= owners-party-race-ranking
GCP_REGION ?= asia-northeast3

.PHONY: frontend-build frontend-deploy backend-build backend-deploy check-basic-auth

frontend-build:
	cd $(FRONTEND_DIR) && npm run build

frontend-deploy: check-basic-auth
	gcloud builds submit $(FRONTEND_DIR) --tag gcr.io/$(GCP_PROJECT)/$(FRONTEND_IMAGE_NAME)
	gcloud run deploy $(FRONTEND_SERVICE_NAME) \
		--image gcr.io/$(GCP_PROJECT)/$(FRONTEND_IMAGE_NAME) \
		--platform managed \
		--region $(GCP_REGION) \
		--set-env-vars BASIC_AUTH_USERNAME=$(BASIC_AUTH_USERNAME),BASIC_AUTH_PASSWORD=$(BASIC_AUTH_PASSWORD) \
		--allow-unauthenticated

check-basic-auth:
ifeq ($(strip $(BASIC_AUTH_USERNAME)),)
	$(error BASIC_AUTH_USERNAME is not set)
endif
ifeq ($(strip $(BASIC_AUTH_PASSWORD)),)
	$(error BASIC_AUTH_PASSWORD is not set)
endif

backend-build:
	gcloud builds submit $(BACKEND_DIR) --tag gcr.io/$(GCP_PROJECT)/$(IMAGE_NAME)

backend-deploy: backend-build
	gcloud run deploy $(IMAGE_NAME) --image gcr.io/$(GCP_PROJECT)/$(IMAGE_NAME) --platform managed --region $(GCP_REGION) --allow-unauthenticated
