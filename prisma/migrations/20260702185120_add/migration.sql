/*
  Warnings:

  - You are about to drop the column `clienteId` on the `depositos` table. All the data in the column will be lost.
  - You are about to drop the `clientes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `produtos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vendas` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `alunoId` to the `depositos` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `depositos` DROP FOREIGN KEY `depositos_clienteId_fkey`;

-- DropForeignKey
ALTER TABLE `vendas` DROP FOREIGN KEY `vendas_clienteId_fkey`;

-- DropForeignKey
ALTER TABLE `vendas` DROP FOREIGN KEY `vendas_produtoId_fkey`;

-- DropIndex
DROP INDEX `depositos_clienteId_fkey` ON `depositos`;

-- AlterTable
ALTER TABLE `depositos` DROP COLUMN `clienteId`,
    ADD COLUMN `alunoId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `clientes`;

-- DropTable
DROP TABLE `produtos`;

-- DropTable
DROP TABLE `vendas`;

-- CreateTable
CREATE TABLE `livros` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `autor` VARCHAR(191) NOT NULL,
    `quant` INTEGER NOT NULL,
    `preco_multa` DOUBLE NOT NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alunos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `saldo_credit` DOUBLE NOT NULL DEFAULT 0.0,

    UNIQUE INDEX `alunos_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emprestimos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alunoId` INTEGER NOT NULL,
    `livroId` INTEGER NOT NULL,
    `quant` INTEGER NOT NULL DEFAULT 1,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `status` ENUM('INATIVO', 'ATIVO') NOT NULL DEFAULT 'INATIVO',
    `nivelAcesso` INTEGER NOT NULL DEFAULT 1,
    `codigoAtivacao` INTEGER NOT NULL,
    `ultimoLogin` DATETIME(3) NULL,
    `codigoRecuperacao` VARCHAR(191) NULL,
    `codigoRecuperacaoExpira` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    UNIQUE INDEX `usuarios_codigoAtivacao_key`(`codigoAtivacao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `acao` VARCHAR(191) NOT NULL,
    `detalhe` VARCHAR(191) NULL,
    `sucesso` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `emprestimos` ADD CONSTRAINT `emprestimos_alunoId_fkey` FOREIGN KEY (`alunoId`) REFERENCES `alunos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emprestimos` ADD CONSTRAINT `emprestimos_livroId_fkey` FOREIGN KEY (`livroId`) REFERENCES `livros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `depositos` ADD CONSTRAINT `depositos_alunoId_fkey` FOREIGN KEY (`alunoId`) REFERENCES `alunos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
