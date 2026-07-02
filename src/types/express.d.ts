export {};

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: number;
        nome: string;
        email: string;
        nivelAcesso: number;
      };
    }
  }
}