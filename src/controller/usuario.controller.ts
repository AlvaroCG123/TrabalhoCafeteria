import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { enviarEmailSeguranca, montarLinkAtivacao, montarMensagemRecuperacao } from '../services/email.service';
import { registrarLog } from '../services/log.service';
import {
  diferencaMinimaSenhas,
  gerarCodigoAtivacao,
  gerarCodigoRecuperacao,
  gerarHashSenha,
  gerarToken,
  validarSenhaForte,
  verificarSenha,
} from '../utils/security';

function formatarData(data: Date | null | undefined): string {
  if (!data) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data);
}

async function gerarCodigoUnico(): Promise<number> {
  for (let tentativa = 0; tentativa < 5; tentativa += 1) {
    const codigo = gerarCodigoAtivacao();
    const existente = await prisma.usuario.findUnique({ where: { codigoAtivacao: codigo } });

    if (!existente) {
      return codigo;
    }
  }

  throw new Error('Nao foi possivel gerar um codigo de ativacao unico.');
}

export class UsuarioController {
  async create(req: Request, res: Response): Promise<Response> {
    const { nome, email, senha, nivelAcesso } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, e-mail e senha sao obrigatorios.' });
    }

    const erroSenha = validarSenhaForte(String(senha));

    if (erroSenha) {
      return res.status(400).json({ error: erroSenha });
    }

    try {
      const existente = await prisma.usuario.findUnique({ where: { email } });

      if (existente) {
        await registrarLog(
          existente.id,
          'CADASTRO_DUPLICADO_USUARIO',
          `Tentativa de cadastro com o e-mail ${email}.`,
          false,
        );

        return res.status(409).json({ error: 'Ja existe um usuario cadastrado com esse e-mail.' });
      }

      const codigoAtivacao = await gerarCodigoUnico();
      const usuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          senha: gerarHashSenha(String(senha)),
          status: 'INATIVO',
          nivelAcesso: Number.isFinite(Number(nivelAcesso)) ? Number(nivelAcesso) : 1,
          codigoAtivacao,
        },
      });

      const linkAtivacao = montarLinkAtivacao(usuario.codigoAtivacao);

      await enviarEmailSeguranca(
        usuario.email,
        'Ativacao de conta',
        `Ola, ${usuario.nome}. Acesse o link para ativar sua conta: ${linkAtivacao}`,
      );

      await registrarLog(
        usuario.id,
        'CADASTRO_USUARIO',
        'Usuario cadastrado com status INATIVO aguardando ativacao.',
        true,
      );

      return res.status(201).json({
        message: 'Usuario cadastrado com sucesso. Verifique o e-mail para ativar a conta.',
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          status: usuario.status,
          nivelAcesso: usuario.nivelAcesso,
          codigoAtivacao: usuario.codigoAtivacao,
          linkAtivacao,
        },
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao cadastrar usuario.' });
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const usuarios = await prisma.usuario.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          status: true,
          nivelAcesso: true,
          ultimoLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { id: 'asc' },
      });

      return res.json(usuarios);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar usuarios.' });
    }
  }

  async activate(req: Request, res: Response): Promise<Response> {
    const codigoAtivacao = Number(req.params.codigoAtivacao);

    if (!Number.isFinite(codigoAtivacao)) {
      return res.status(400).json({ error: 'Codigo de ativacao invalido.' });
    }

    try {
      const usuario = await prisma.usuario.findUnique({ where: { codigoAtivacao } });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario nao encontrado para esse codigo.' });
      }

      if (usuario.status === 'ATIVO') {
        return res.json({ message: 'Conta ja estava ativada.' });
      }

      const atualizado = await prisma.usuario.update({
        where: { id: usuario.id },
        data: { status: 'ATIVO' },
      });

      await registrarLog(
        atualizado.id,
        'ATIVACAO_USUARIO',
        'Conta ativada com sucesso pelo link de e-mail.',
        true,
      );

      return res.json({
        message: 'Conta ativada com sucesso.',
        usuario: {
          id: atualizado.id,
          nome: atualizado.nome,
          email: atualizado.email,
          status: atualizado.status,
        },
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao ativar usuario.' });
    }
  }

  async login(req: Request, res: Response): Promise<Response> {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha sao obrigatorios.' });
    }

    try {
      const usuario = await prisma.usuario.findUnique({ where: { email } });

      if (!usuario) {
        return res.status(401).json({ error: 'Credenciais invalidas.' });
      }

      if (usuario.status !== 'ATIVO') {
        await registrarLog(usuario.id, 'LOGIN_NEGADO', 'Tentativa de login em conta inativa.', false);
        return res.status(403).json({ error: 'Conta ainda nao foi ativada.' });
      }

      if (!verificarSenha(String(senha), usuario.senha)) {
        await registrarLog(usuario.id, 'LOGIN_NEGADO', 'Senha incorreta.', false);
        return res.status(401).json({ error: 'Credenciais invalidas.' });
      }

      const token = gerarToken({
        sub: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        nivelAcesso: usuario.nivelAcesso,
      });

      const ultimoAcesso = formatarData(usuario.ultimoLogin);

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { ultimoLogin: new Date() },
      });

      await registrarLog(usuario.id, 'LOGIN', 'Login realizado com sucesso.', true);

      return res.json({
        message: ultimoAcesso
          ? `Bem-vindo, ${usuario.nome}. Seu ultimo acesso ao sistema foi em ${ultimoAcesso}.`
          : `Bem-vindo, ${usuario.nome}. Este e o seu primeiro acesso ao sistema.`,
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          status: usuario.status,
          nivelAcesso: usuario.nivelAcesso,
        },
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao realizar login.' });
    }
  }

  async requestPasswordReset(req: Request, res: Response): Promise<Response> {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'E-mail e obrigatorio.' });
    }

    try {
      const usuario = await prisma.usuario.findUnique({ where: { email } });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario nao encontrado.' });
      }

      const codigoRecuperacao = gerarCodigoRecuperacao();
      const codigoRecuperacaoExpira = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          codigoRecuperacao,
          codigoRecuperacaoExpira,
        },
      });

      await enviarEmailSeguranca(
        usuario.email,
        'Recuperacao de senha',
        montarMensagemRecuperacao(codigoRecuperacao),
      );

      await registrarLog(
        usuario.id,
        'RECUPERACAO_SENHA_SOLICITADA',
        'Codigo de recuperacao enviado para o e-mail cadastrado.',
        true,
      );

      return res.json({
        message: 'Codigo de recuperacao enviado para o e-mail cadastrado.',
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao solicitar recuperacao de senha.' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<Response> {
    const { email, codigoRecuperacao, novaSenha } = req.body;

    if (!email || !codigoRecuperacao || !novaSenha) {
      return res.status(400).json({ error: 'E-mail, codigo e nova senha sao obrigatorios.' });
    }

    const erroSenha = validarSenhaForte(String(novaSenha));

    if (erroSenha) {
      return res.status(400).json({ error: erroSenha });
    }

    try {
      const usuario = await prisma.usuario.findUnique({ where: { email } });

      if (!usuario || !usuario.codigoRecuperacao || !usuario.codigoRecuperacaoExpira) {
        return res.status(400).json({ error: 'Codigo de recuperacao invalido.' });
      }

      if (usuario.codigoRecuperacao !== codigoRecuperacao) {
        return res.status(400).json({ error: 'Codigo de recuperacao invalido.' });
      }

      if (usuario.codigoRecuperacaoExpira < new Date()) {
        return res.status(400).json({ error: 'Codigo de recuperacao expirado.' });
      }

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          senha: gerarHashSenha(String(novaSenha)),
          codigoRecuperacao: null,
          codigoRecuperacaoExpira: null,
        },
      });

      await registrarLog(
        usuario.id,
        'RECUPERACAO_SENHA_CONCLUIDA',
        'Senha redefinida com sucesso a partir do codigo de recuperacao.',
        true,
      );

      return res.json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao redefinir senha.' });
    }
  }

  async changePassword(req: Request, res: Response): Promise<Response> {
    const { senhaAtual, novaSenha } = req.body;
    const authUser = req.authUser;

    if (!authUser) {
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ error: 'Senha atual e nova senha sao obrigatorias.' });
    }

    const erroSenha = validarSenhaForte(String(novaSenha));

    if (erroSenha) {
      return res.status(400).json({ error: erroSenha });
    }

    if (diferencaMinimaSenhas(String(senhaAtual), String(novaSenha)) < 2) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 2 caracteres diferentes da antiga.' });
    }

    try {
      const usuario = await prisma.usuario.findUnique({ where: { id: authUser.id } });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario nao encontrado.' });
      }

      if (!verificarSenha(String(senhaAtual), usuario.senha)) {
        await registrarLog(usuario.id, 'ALTERACAO_SENHA_NEGADA', 'Senha atual informada incorretamente.', false);
        return res.status(400).json({ error: 'Senha atual invalida.' });
      }

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { senha: gerarHashSenha(String(novaSenha)) },
      });

      await registrarLog(
        usuario.id,
        'ALTERACAO_SENHA',
        'Senha alterada com sucesso pelo usuario autenticado.',
        true,
      );

      return res.json({ message: 'Senha alterada com sucesso.' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao alterar senha.' });
    }
  }
}