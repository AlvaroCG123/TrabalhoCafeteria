import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export class LivroController {
  async create(req: Request, res: Response): Promise<Response> {
    const { titulo, autor, nome, quant, preco, preco_multa } = req.body;
    try {
      const livro = await prisma.livro.create({
        data: {
          titulo: titulo || nome,
          autor: autor || 'Desconhecido',
          quant: quant || 1,
          preco_multa: preco_multa ?? preco ?? 0.0
        }
      });
      return res.status(201).json(livro);
    } catch (error: any) {
      return res.status(400).json({ error: 'Erro ao cadastrar livro.' });
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const livros = await prisma.livro.findMany({
        where: { deleted: false }
      });
      return res.json(livros);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar livros.' });
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const authUser = req.authUser;

    if (!authUser) {
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }

    if (authUser.nivelAcesso < 3) {
      return res.status(403).json({ error: 'Nivel de acesso insuficiente para excluir livros.' });
    }

    try {
      const livro = await prisma.livro.findFirst({
        where: {
          id: Number(id),
          deleted: false,
        }
      });

      if (!livro) {
        return res.status(404).json({ error: 'Livro nao encontrado.' });
      }

      const atualizado = await prisma.livro.update({
        where: { id: Number(id) },
        data: {
          deleted: true,
          deletedAt: new Date(),
        }
      });

      return res.json({ message: 'Livro removido com soft delete.', livro: atualizado });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao excluir livro.' });
    }
  }
}
