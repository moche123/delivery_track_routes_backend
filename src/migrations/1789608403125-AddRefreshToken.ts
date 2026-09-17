import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshToken1789608403125 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "refresh_token" (
                "id"          SERIAL PRIMARY KEY,
                "token_hash"  VARCHAR(64) NOT NULL UNIQUE,
                "usuario_id"  INTEGER NOT NULL REFERENCES "usuario"("id") ON DELETE CASCADE,
                "expires_at"  TIMESTAMPTZ NOT NULL,
                "revoked_at"  TIMESTAMPTZ,
                "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_refresh_token_usuario_id"
            ON "refresh_token" ("usuario_id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_token"`);
  }
}
