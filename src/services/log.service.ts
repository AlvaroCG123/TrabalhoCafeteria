import { prisma } from '../../lib/prisma';

export async function registrarLog(
  usuarioId: number,
  acao: string,
  detalhe: string,
  sucesso = true,
): Promise<void> {
  try {
    await prisma.log.create({
      data: {
        usuarioId,
        acao,
        detalhe,
        sucesso,
      },
    });
  } catch (error) {
    console.error('Nao foi possivel registrar o log do sistema.', error);
  }
}