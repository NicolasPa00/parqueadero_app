import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly theme = signal<ThemeMode>('system');
  private readonly systemPreference = signal<'light' | 'dark'>('light');

  readonly resolvedTheme = computed<'light' | 'dark'>(() => {
    const t = this.theme();
    return t === 'system' ? this.systemPreference() : t;
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initTheme();
      effect(() => this.applyTheme());
    }
  }

  private initTheme(): void {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemPreference.set(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', (e) => this.systemPreference.set(e.matches ? 'dark' : 'light'));

    const saved = localStorage.getItem('parq_theme') as ThemeMode | null;
    if (saved) this.theme.set(saved);
  }

  toggleTheme(): void {
    this.setTheme(this.resolvedTheme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('parq_theme', mode);
    }
  }

  private applyTheme(): void {
    const resolved = this.resolvedTheme();
    document.documentElement.setAttribute('data-theme', resolved);
  }
}
