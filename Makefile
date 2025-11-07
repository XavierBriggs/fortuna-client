.PHONY: help install dev build start clean docker-build docker-run

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

dev: ## Run development server
	npm run dev

build: ## Build for production
	npm run build

start: ## Start production server
	npm start

lint: ## Run linter
	npm run lint

type-check: ## Run TypeScript type checking
	npm run type-check

clean: ## Clean build artifacts and dependencies
	rm -rf node_modules .next

docker-build: ## Build Docker image
	docker build -t fortuna-client:latest .

docker-run: ## Run Docker container
	docker run -p 3000:3000 \
		-e NEXT_PUBLIC_WS_URL=ws://host.docker.internal:8082/ws \
		-e NEXT_PUBLIC_API_URL=http://host.docker.internal:8081 \
		fortuna-client:latest

