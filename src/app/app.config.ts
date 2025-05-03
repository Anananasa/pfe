import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { devextremeConfig } from './devextreme.config';
import { MediaCapture } from '@awesome-cordova-plugins/media-capture/ngx';
import { FileUploadService } from './services/media_services/file-upload.service';
import { AutoReloadService } from './services/auto-reload.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... autres providers
    provideHttpClient(),
    MediaCapture,
    FileUploadService,
    AutoReloadService,
    ...devextremeConfig.imports
  ]
};
