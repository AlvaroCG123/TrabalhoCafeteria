import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { IRecargaInput } from '../interface/recarga.interface';

export class RecargaController {
  // TRANSAÇÃO DE RECARGA (Opcional, mas garante consistência)
  async create(req: Request, res: Response): Promise<Response> {
    const { clienteId, tipo, valor }: IRecargaInput = req.body;

    try {
      const resultado = await prisma.$transaction(async (tx) => {
        const cliente = await tx.cliente.findUnique({ where: { id: clienteId } });
        if (!cliente) throw new Error('Cliente não encontrado.');

        // 1. Atualiza o saldo do cliente somando a recarga
        await tx.cliente.update({
          where: { id: clienteId },
          data: { saldo_credit: cliente.saldo_credit + valor }
        });

        // 2. Cria o registro do depósito/recarga
        const novaRecarga = await tx.recarga.create({
          data: { clienteId, tipo, valor }
        });

        return novaRecarga;
      });

      return res.status(201).json({ message: 'Recarga efetuada!', resultado });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const recargas = await prisma.recarga.findMany({ include: { cliente: true } });
      return res.json(recargas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar recargas.' });
    }
  }
}