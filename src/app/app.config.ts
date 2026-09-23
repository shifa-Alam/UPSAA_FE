import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { TitleStrategy, provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { authInterceptor } from './Services/auth.interceptor';
import { AppTitleStrategy } from './Utils/app-title.strategy';



export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideClientHydration(), 
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]) // <-- Add interceptor here
    ),
    provideNativeDateAdapter(),
    // Per-page, translated browser-tab titles (route `title` = pageTitles.* key).
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    // Material's default 80vw cap leaves phone dialogs cramped.
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { maxWidth: '96vw', autoFocus: 'first-tabbable', hasBackdrop: true } },
  ]
};
