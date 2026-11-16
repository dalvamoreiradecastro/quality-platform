import 'dotenv/config';
import { z } from 'zod';

/**
 * Configuração centralizada e validada.
 * Falha cedo (antes de qualquer teste rodar) se algo estiver inválido.
 */
const EnvSchema = z.object({
  API_BASE_URL: z.string().url().default('https://restful-booker.herokuapp.com'),
  API_USERNAME: z.string().default('admin'),
  API_PASSWORD: z.string().default('password123'),

  UI_BASE_URL: z.string().url().default('https://www.saucedemo.com'),
  UI_USERNAME: z.string().default('standard_user'),
  UI_PASSWORD: z.string().default('secret_sauce'),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
