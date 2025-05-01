import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { environment } from './environments/environment';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { MediaCapture } from '@awesome-cordova-plugins/media-capture/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { DatePipe } from '@angular/common';

if (environment.production) {
  enableProdMode();
}

// Initialisation des éléments PWA
defineCustomElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideIonicAngular(),
    provideHttpClient(),
    MediaCapture,
    FileOpener,
    DatePipe
  ]
}).catch(err => console.error(err));
