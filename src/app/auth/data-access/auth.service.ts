import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import {
  AccesoParqueadero,
  VerificarTokenResponse,
  UserNegocio,
} from '../../core/models/parqueadero.models';

const STORAGE_TOKEN = 'parq_token';
const STORAGE_USER = 'parq_user_meta';
const STORAGE_NEGOCIO = 'parq_negocio';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiBase = inject(API_BASE_URL);
  private readonly platformId = inject(PLATFORM_ID);

  /** Access data signals */
  private readonly _accessData = signal<AccesoParqueadero | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _selectedNegocio = signal<UserNegocio | null>(null);

  readonly accessData = this._accessData.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessData() && !!this._token());
  readonly usuario = computed(() => this._accessData()?.usuario ?? null);
  readonly negocios = computed(() => this._accessData()?.negocios ?? []);
  readonly negocio = computed(() => this._selectedNegocio() ?? this._accessData()?.negocio ?? null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.restoreSession();
    }
  }

  getToken(): string | null {
    return this._token();
  }

  /**
   * Verifica el token JWT contra el backend del parqueadero.
   * Se llama con el token que ya tiene el usuario del admin_app.
   */
  verificarToken(token: string): Observable<VerificarTokenResponse> {
    return this.http
      .post<VerificarTokenResponse>(`${this.apiBase}/auth/verificar-token`, { token })
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this._token.set(token);
            this._accessData.set(res.data);
            this._selectedNegocio.set(res.data.negocio);
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem(STORAGE_TOKEN, token);
              localStorage.setItem(STORAGE_USER, JSON.stringify(res.data));
              if (res.data.negocio) {
                localStorage.setItem(STORAGE_NEGOCIO, JSON.stringify(res.data.negocio));
              }
            }
          }
        }),
      );
  }

  selectNegocio(negocio: UserNegocio): void {
    this._selectedNegocio.set(negocio);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_NEGOCIO, JSON.stringify(negocio));
    }
  }

  /**
   * Canjea un código de acceso de un solo uso generado por el admin_app.
   * El backend verifica el JWT original, comprueba permisos de parqueadero
   * y devuelve los datos completos del usuario + niveles asignados.
   */
  canjearCodigo(code: string): Observable<VerificarTokenResponse> {
    return this.http
      .post<VerificarTokenResponse>(`${this.apiBase}/auth/canjear-codigo`, { code })
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            const { token, ...acceso } = res.data as AccesoParqueadero & { token: string };
            this._token.set(token);
            this._accessData.set(acceso);
            this._selectedNegocio.set(acceso.negocio);
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem(STORAGE_TOKEN, token);
              localStorage.setItem(STORAGE_USER, JSON.stringify(acceso));
              if (acceso.negocio) {
                localStorage.setItem(STORAGE_NEGOCIO, JSON.stringify(acceso.negocio));
              }
            }
          }
        }),
      );
  }

  logout(): void {
    this._token.set(null);
    this._accessData.set(null);
    this._selectedNegocio.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_USER);
      localStorage.removeItem(STORAGE_NEGOCIO);
    }
    this.router.navigate(['/acceso']);
  }

  private restoreSession(): void {
    const token = localStorage.getItem(STORAGE_TOKEN);
    const userJson = localStorage.getItem(STORAGE_USER);
    const negocioJson = localStorage.getItem(STORAGE_NEGOCIO);

    if (token && userJson) {
      try {
        const data = JSON.parse(userJson) as AccesoParqueadero;
        this._token.set(token);
        this._accessData.set(data);
        if (negocioJson) {
          this._selectedNegocio.set(JSON.parse(negocioJson));
        } else {
          this._selectedNegocio.set(data.negocio);
        }
      } catch {
        this.logout();
      }
    }
  }
}
