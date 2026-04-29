import { resolve } from 'node:path';
import * as dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../.env.test'), override: true, quiet: true });
