# Setup

## Node

Use node version 24
With nvm u can use:

```
nvm install 24
```

## Use pnpm

```
npm install -g pnpm
```

## Install dependencies

```
pnpm install
```

## create .env file

In backend folder is a .env.example. Copy this file and rename it *.env* file.
U will need APP_KEY.
Use this command to generate APP_KEY. You need to be in backend folder. Paste this key to .env file.

```
node ace generate:key
```

## Start DB server (Not required in Phase 1)

```
docker run --name postgresql-container -e POSTGRES_PASSWORD=postgresadm -d -p 5432:5432 postgres
```

## Migrate DB (Not required in Phase 1)

```
pnpm --filter backend exec node ace migration:run
```

# Running the project

## Start backend (Not required in Phase 1)

```
pnpm --filter backend dev
```

## Start frontend

```
pnpm --filter frontend dev
```
