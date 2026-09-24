import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPedidoActualizadoEn1790207169383 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "pedido"
            ADD COLUMN IF NOT EXISTS "actualizado_en" TIMESTAMPTZ NOT NULL DEFAULT now()
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "pedido" DROP COLUMN IF EXISTS "actualizado_en"
        `);
  }
}
