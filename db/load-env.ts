// Imported first by scripts so .env.local is loaded before any module that
// reads process.env at import time (the connection pool in ./index).
import { config } from "dotenv";

config({ path: ".env.local" });
config();
