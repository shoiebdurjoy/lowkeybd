import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  JWT_SECRET: Joi.string().default('super-secret-key-for-dev'),
  MEILISEARCH_HOST: Joi.string().default('http://localhost:7700'),
  MEILISEARCH_API_KEY: Joi.string().default('masterKey123!'),
  SMTP_HOST: Joi.string().default('127.0.0.1'),
  SMTP_PORT: Joi.number().default(1025),
});
