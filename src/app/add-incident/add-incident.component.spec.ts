import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { AddIncidentComponent } from './add-incident.component';
import { ApiService } from '../services/api.service';

describe('AddIncidentComponent', () => {
  let component: AddIncidentComponent;
  let fixture: ComponentFixture<AddIncidentComponent>;
  let apiService: ApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        HttpClientTestingModule,
        ReactiveFormsModule,
        RouterTestingModule,
        AddIncidentComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddIncidentComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.incidentForm).toBeDefined();
    expect(component.incidentForm.get('designation')?.value).toBe('');
    expect(component.incidentForm.get('date')?.value).toBe('');
    expect(component.incidentForm.get('dateDeclaration')?.value).toBe('');
  });

  it('should be invalid when empty', () => {
    expect(component.incidentForm.valid).toBeFalsy();
  });

  it('should be valid when required fields are filled', () => {
    component.incidentForm.patchValue({
      designation: 'Test Incident',
      date: '2024-03-19',
      dateDeclaration: '2024-03-19'
    });
    expect(component.incidentForm.valid).toBeTruthy();
  });

  it('should handle file changes', () => {
    const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    const mockEvent = {
      target: {
        files: [mockFile]
      }
    };
    component.onFileChange(mockEvent);
    expect(component.incidentForm.get('files')?.value).toEqual([mockFile]);
  });
}); 