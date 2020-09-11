DOCDIR := docs
DOCKER := docker
DATA_VOLUME := $(shell pwd)
IMAGE := liberoadmin/article-hosting-importer
IMAGE_TAG := local
PORT := 8000

.PHONY: build clean dev install lint* prod test

prod: build
	touch .env
	$(DOCKER) run \
		-p $(PORT):8000 \
		--env-file .env \
		$(IMAGE):$(IMAGE_TAG)

lint: build
	$(DOCKER) run --rm \
		-v $(DATA_VOLUME)/.eslint:/app/.eslint \
		-v $(DATA_VOLUME)/build:/app/build \
		$(IMAGE):$(IMAGE_TAG)-dev \
		npm run lint

lint\:fix: build
	$(DOCKER) run --rm \
		-v $(DATA_VOLUME)/.eslint:/app/.eslint \
		-v $(DATA_VOLUME)/build:/app/build \
		-v $(DATA_VOLUME)/scripts:/app/scripts \
		-v $(DATA_VOLUME)/src:/app/src \
		-v $(DATA_VOLUME)/test:/app/test \
		$(IMAGE):$(IMAGE_TAG)-dev \
		npm run lint:fix

test: build
	$(DOCKER) run \
		-v $(DATA_VOLUME)/.jest:/app/.jest \
		-v $(DATA_VOLUME)/build:/app/build \
		$(IMAGE):$(IMAGE_TAG)-dev \
		npm run test

build:
	@if [ "$(TARGET)" != prod ]; then \
		image_tag_suffix=-dev; \
	fi; \
	$(DOCKER) build -t $(IMAGE):$(IMAGE_TAG)$${image_tag_suffix} . --target $(TARGET)

install: node_modules

node_modules: package.json package-lock.json
	npm install
	touch node_modules

clean:
	rm -rf .eslint .jest build node_modules

release:
	TAG=latest/$$(date +%Y%m%d%H%M); git tag $$TAG && git push origin $$TAG