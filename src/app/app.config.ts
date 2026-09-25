import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { TitleStrategy, provideRouter, withPreloading, withViewTransitions } from '@angular/router';
import { IdlePreloadStrategy } from './Utils/idle-preload.strategy';
import { provideServiceWorker } from '@angular/service-worker';

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
    provideRouter(routes,
      // Native-app feel: a soft cross-fade between pages (browsers without the
      // View Transitions API just navigate as before).
      withViewTransitions({ skipInitialTransition: true }),
      // Fetch the other pages in the background once idle, so taps open instantly.
      withPreloading(IdlePreloadStrategy)
    ),
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
    // Offline cache + installable app (production builds only — see ngsw-config.json).
    // Registered once the app is idle so it never competes with the first page load.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { maxWidth: '96vw', autoFocus: 'first-tabbable', hasBackdrop: true } },
  ]
};
