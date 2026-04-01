.PHONY: dev start build check fmt fmt-fix lint typecheck test clean \
        db-setup db-generate db-migrate db-seed db-studio kill

dev: kill
	bun run dev:web & bun run dev:api

start:
	bun run start

build:
	bun run build

check: fmt lint typecheck test

fmt:
	bun run fmt

fmt-fix:
	bun run fmt:fix

lint:
	bun run lint


typecheck:
	bun run typecheck

test:
	@echo "No tests yet — placeholder"

clean:
	find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +
	find . -name 'dist' -type d -prune -exec rm -rf '{}' +

kill:
	@bash scripts/kill-ports.sh

db-setup:
	psql -h localhost -U postgres -f scripts/setup-cbbi-db.sql

db-generate:
	bun run db:generate

db-migrate:
	bun run db:migrate

db-seed:
	bun run db:seed

db-studio:
	bun run db:studio
