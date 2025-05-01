import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActionMediaComponent } from './action-media.component';

describe('ActionMediaComponent', () => {
  let component: ActionMediaComponent;
  let fixture: ComponentFixture<ActionMediaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ActionMediaComponent ],
      imports: []
    }).compileComponents();

    fixture = TestBed.createComponent(ActionMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
