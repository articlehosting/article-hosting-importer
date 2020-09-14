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

lint: install
	npm run lint

lint\:fix: install
	npm run lint:fix

test: install
	npm run test

build:
	@if [ "$(TARGET)" != prod ]; then \
		image_tag_suffix=-dev; \
	fi; \
	$(DOCKER) build -t $(IMAGE):$(IMAGE_TAG)$${image_tag_suffix} .

install: node_modules

node_modules: package.json package-lock.json
	npm install
	touch node_modules

clean:
	rm -rf .eslint .jest build node_modules

release:
	TAG=latest/$$(date +%Y%m%d%H%M); git tag $$TAG && git push origin $$TAG