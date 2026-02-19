import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NominationApplicationComponent } from './nomination-application.component';

describe('NominationApplicationComponent', () => {
  let component: NominationApplicationComponent;
  let fixture: ComponentFixture<NominationApplicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NominationApplicationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NominationApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
