import { ComponentFixture, TestBed } from '@angular/core/testing';
import { loginPage } from './login.page';

describe('loginPage', () => {
  let component: loginPage;
  let fixture: ComponentFixture<loginPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(loginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
