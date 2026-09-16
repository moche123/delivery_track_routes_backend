import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginTicket, OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';

export interface LoginResult {
  token: string;
  user: {
    id: number;
    nombre: string;
    foto: string | null;
    email: string | null;
  };
}

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async loginWithGoogle(idToken: string): Promise<LoginResult> {
    if (!GOOGLE_CLIENT_ID || !idToken) {
      throw new UnauthorizedException('Falta client_id o token de Google');
    }

    let ticket: LoginTicket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
    } catch {
      throw new UnauthorizedException('Token de Google inválido');
    }

    const payload = ticket.getPayload();
    if (!payload?.sub) {
      throw new UnauthorizedException('Token de Google inválido');
    }

    const googleId = payload.sub;
    let usuario = await this.usuarios.findOne({ where: { googleId } });

    const data = {
      email: payload.email ?? null,
      nombre: payload.name ?? payload.email ?? 'Usuario de Google',
      foto: payload.picture ?? null,
    };

    if (!usuario) {
      usuario = await this.usuarios.save(
        this.usuarios.create({ googleId, tipo: 'cliente', ...data }),
      );
    } else {
      await this.usuarios.update(usuario.id, data);
      usuario = await this.usuarios.findOneOrFail({
        where: { id: usuario.id },
      });
    }

    const token = await this.jwtService.signAsync({
      sub: usuario.id,
      googleId,
      email: usuario.email,
    });

    return {
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        foto: usuario.foto,
        email: usuario.email,
      },
    };
  }
}
