import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { HttpClientModule } from '@angular/common/http';
import * as IonIcons from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Platform } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, HttpClientModule],
})
export class AppComponent implements OnInit {
  constructor(private platform: Platform) {
    addIcons(IonIcons);
  }

  ngOnInit() {
    this.platform.keyboardDidShow.subscribe(event => {
      const { keyboardHeight } = event;
      const content = document.querySelector('ion-content');
      if (content) {
        content.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
      }
    });

    this.platform.keyboardDidHide.subscribe(() => {
      const content = document.querySelector('ion-content');
      if (content) {
        content.style.removeProperty('--keyboard-height');
      }
    });
  }

  ngAfterViewInit() {
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        const heightDiff = window.innerHeight - (window.visualViewport?.height ?? 0);
        if (heightDiff > 100) {
          document.body.classList.add('keyboard-open');
        } else {
          document.body.classList.remove('keyboard-open');
        }
      });
    }
  }
}
