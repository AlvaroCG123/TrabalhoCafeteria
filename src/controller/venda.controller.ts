import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { IVendaInput } from '../interface/venda.interface';

export class VendaController {
  
  async create(req: Request, res: Response): Promise<Response> {
    const { clienteId, produtoId, quant }: IVendaInput = req.body;

    try {
      const resultado = await prisma.$transaction(async (tx) => {
        const produto = await tx.produto.findUnique({ where: { id: produtoId } });
        if (!produto || produto.quant < quant) {
          throw new Error('Produto indisponível ou estoque insuficiente.');
        }

        const cliente = await tx.cliente.findUnique({ where: { id: clienteId } });
        if (!cliente) throw new Error('Cliente não encontrado.');

        const valorTotal = produto.preco * quant;
        if (cliente.saldo_credit < valorTotal) {
          throw new Error('Saldo insuficiente para realizar a compra.');
        }

        await tx.produto.update({
          where: { id: produtoId },
          data: { quant: produto.quant - quant }
        });

        await tx.cliente.update({
          where: { id: clienteId },
          data: { saldo_credit: cliente.saldo_credit - valorTotal }
        });

        const novaVenda = await tx.venda.create({
          data: { clienteId, produtoId, quant, preco: produto.preco }
        });

        return novaVenda;
      });

      return res.status(201).json({ message: 'Venda processada com sucesso!', resultado });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const vendas = await prisma.venda.findMany({
        include: { cliente: true, produto: true }
      });
      return res.json(vendas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar vendas.' });
    }
  }

  // ITEM 4 DO TRABALHO: Exclusão de registro com TRANSAÇÃO [cite: 12, 20]
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      await prisma.$transaction(async (tx) => {
        const venda = await tx.venda.findUnique({ where: { id: Number(id) } });
        if (!venda) throw new Error('Registro de venda não encontrado.');

        const valorEstorno = venda.preco * venda.quant;

        // Devolve produtos ao estoque (Incrementa)
        await tx.produto.update({
          where: { id: venda.produtoId },
          data: { quant: { increment: venda.quant } }
        });

        // Devolve o dinheiro ao saldo do cliente (Incrementa)
        await tx.cliente.update({
          where: { id: venda.clienteId },
          data: { saldo_credit: { increment: valorEstorno } }
        });

        // Remove a venda do histórico
        await tx.venda.delete({ where: { id: Number(id) } });
      });

      return res.json({ message: 'Venda cancelada e valores estornados com sucesso!' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}