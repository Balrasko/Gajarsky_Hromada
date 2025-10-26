# Setup

## Node
```
Use node version 24 
With nvm u can use *nvm install 24*
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

```
In backend folder is a .env.example. Copy this file and create .env file. Use this command *node ace generate:key* to generate APP_KEY. You need to be in backend folder.
```

## Start DB server

```
docker run --name postgresql-container -e POSTGRES_PASSWORD=postgresadm -d -p 5432:5432 postgres
```

## Migrate DB

```
pnpm --filter backend exec node ace migration:run
```

# Running the project

## Start backend

```
pnpm --filter backend dev
```

## Start frontend

```
pnpm --filter frontend dev
```
