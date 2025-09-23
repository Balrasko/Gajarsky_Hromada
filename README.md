# Setup
## Use pnpm
```
npm install -g pnpm
```

## Start DB server
```
docker run --name postgresql-container -e POSTGRES_PASSWORD=postgresadm -d -p 5432:5432 postgres
```

## Install dependencies
```
pnpm install 
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