import {
  createHmac,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

const TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'trabalhocafeteria-token-secret';

export interface TokenPayload {
  sub: number;
  email: string;
  nome: string;
  nivelAcesso: number;
  iat: number;
  exp: number;
}

export function validarSenhaForte(senha: string): string | null {
  if (senha.length < 8) {
    return 'A senha deve ter no minimo 8 caracteres.';
  }

  if (!/[a-z]/.test(senha)) {
    return 'A senha deve conter letras minusculas.';
  }

  if (!/[A-Z]/.test(senha)) {
    return 'A senha deve conter letras maiusculas.';
  }

  if (!/[0-9]/.test(senha)) {
    return 'A senha deve conter numeros.';
  }

  if (!/[^A-Za-z0-9]/.test(senha)) {
    return 'A senha deve conter simbolos.';
  }

  return null;
}

export function gerarHashSenha(senha: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(senha, salt, 64).toString('hex');

  return `${salt}:${hash}`;
}

export function verificarSenha(senha: string, hashArmazenado: string): boolean {
  const [salt, hash] = hashArmazenado.split(':');

  if (!salt || !hash) {
    return false;
  }

  const hashCalculado = scryptSync(senha, salt, 64);
  const hashGuardado = Buffer.from(hash, 'hex');

  if (hashGuardado.length !== hashCalculado.length) {
    return false;
  }

  return timingSafeEqual(hashGuardado, hashCalculado);
}

export function gerarCodigoAtivacao(): number {
  return randomInt(100000, 999999);
}

export function gerarCodigoRecuperacao(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export function gerarToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  expiraEmSegundos = 60 * 60 * 8,
): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const tokenPayload: TokenPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiraEmSegundos,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
  const assinatura = createHmac('sha256', TOKEN_SECRET).update(payloadBase64).digest('base64url');

  return `${payloadBase64}.${assinatura}`;
}

export function verificarToken(token: string): TokenPayload | null {
  const [payloadBase64, assinatura] = token.split('.');

  if (!payloadBase64 || !assinatura) {
    return null;
  }

  const assinaturaEsperada = createHmac('sha256', TOKEN_SECRET).update(payloadBase64).digest('base64url');

  if (assinaturaEsperada !== assinatura) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8')) as TokenPayload;

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function extrairTokenDoHeader(authorization?: string): string | null {
  if (!authorization) {
    return null;
  }

  const [tipo, token] = authorization.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

export function diferencaMinimaSenhas(senhaAntiga: string, senhaNova: string): number {
  const tamanho = Math.max(senhaAntiga.length, senhaNova.length);
  let diferencas = 0;

  for (let indice = 0; indice < tamanho; indice += 1) {
    if (senhaAntiga[indice] !== senhaNova[indice]) {
      diferencas += 1;
    }
  }

  return diferencas;
}