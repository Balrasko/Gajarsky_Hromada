# Setup

## create .env file
```
In backend folder is a .env.example. Copy this file and create .env. Use this command node ace generate:key to generate APP_KEY. You need to be in backend folder.


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