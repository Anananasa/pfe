import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { HttpClientModule } from '@angular/common/http';
import * as IonIcons from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, HttpClientModule],
})
export class AppComponent implements OnInit {
  constructor() {
    addIcons(IonIcons);
  }

  ngOnInit() {
    if (Capacitor.getPlatform() !== 'web') {
      Keyboard.setAccessoryBarVisible({ isVisible: true });
      Keyboard.setScroll({ isDisabled: false });
      Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    }
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.classList.add('keyboard-open');
      console.log('Keyboard shown with height:', info.keyboardHeight);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
      console.log('Keyboard hidden');
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
