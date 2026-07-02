import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { env } from "prisma/config";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaMariaDb({
  host: env("DATABASE_HOST"),
  user: env("DATABASE_USER"),
  password: env("DATABASE_PASSWORD"),
  database: env("DATABASE_NAME"),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

export { prisma };