import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule } from '@ionic/angular';

import { IncidentListComponent } from './incident-list.component';

describe('IncidentListPage', () => {
  let component: IncidentListComponent;
  let fixture: ComponentFixture<IncidentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        HttpClientTestingModule,
        IncidentListComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty incidents array', () => {
    expect(component.incidents).toBeDefined();
    expect(component.incidents.length).toBe(0);
  });
}); 