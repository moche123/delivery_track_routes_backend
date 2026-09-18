import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { LoginTicket, OAuth2Client } from 'google-auth-library';
import { IsNull, Repository } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { Usuario } from './usuario.entity';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const ACCESS_TOKEN_TTL_SECONDS = Number(
  process.env.JWT_ACCESS_TTL_SECONDS ?? 15 * 60,
);
const REFRESH_TOKEN_TTL_MS = Number(
  process.env.JWT_REFRESH_TTL_MS ?? 7 * 24 * 60 * 60 * 1000,
);

export interface AuthUser {
  id: number;
  nombre: string;
  foto: string | null;
  email: string | null;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
  ) {}

  async loginWithGoogle(
    idToken: string,
    tipoSolicitado?: string,
  ): Promise<LoginResult> {
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
        this.usuarios.create({
          googleId,
          tipo: this.resolverTipoNuevoUsuario(tipoSolicitado),
          ...data,
        }),
      );
    } else {
      await this.usuarios.update(usuario.id, data);
      usuario = await this.usuarios.findOneOrFail({
        where: { id: usuario.id },
      });
    }

    return this.issueSession(usuario);
  }

  /**
   * Valida un refresh token, lo invalida (rotación de un solo uso) y emite un
   * par nuevo de tokens. Si no existe, ya fue usado o expiró, rechaza.
   */
  async refresh(refreshToken: string): Promise<LoginResult> {
    if (!refreshToken) {
      throw new UnauthorizedException('Sesión expirada');
    }

    const stored = await this.refreshTokens.findOne({
      where: { tokenHash: this.hash(refreshToken), revokedAt: IsNull() },
      relations: { usuario: true },
    });

    if (!stored || stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Sesión expirada');
    }

    stored.revokedAt = new Date();
    await this.refreshTokens.save(stored);

    return this.issueSession(stored.usuario);
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await this.refreshTokens.update(
      { tokenHash: this.hash(refreshToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async me(usuarioId: number): Promise<AuthUser> {
    const usuario = await this.usuarios.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return this.toAuthUser(usuario);
  }

  private async issueSession(usuario: Usuario): Promise<LoginResult> {
    const accessToken = await this.jwtService.signAsync(
      { sub: usuario.id, email: usuario.email, tipo: usuario.tipo },
      { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
    );

    const refreshToken = randomBytes(48).toString('base64url');
    await this.refreshTokens.save(
      this.refreshTokens.create({
        tokenHash: this.hash(refreshToken),
        usuarioId: usuario.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      }),
    );

    return {
      accessToken,
      refreshToken,
      user: this.toAuthUser(usuario),
    };
  }

  private toAuthUser(usuario: Usuario): AuthUser {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      foto: usuario.foto,
      email: usuario.email,
    };
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Decide el `tipo` de un usuario nuevo. Confía en lo que manda el caller
   * (cada front, rider/client, envía su propio tipo fijo) porque hoy no hay
   * ningún control de roles en el backend. Punto único de reemplazo si más
   * adelante se agrega un gate real (ej. aprobación admin para drivers).
   */
  private resolverTipoNuevoUsuario(
    tipoSolicitado?: string,
  ): 'cliente' | 'driver' {
    return tipoSolicitado === 'driver' ? 'driver' : 'cliente';
  }
}
