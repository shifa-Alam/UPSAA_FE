import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoteCastsComponent } from './vote-casts.component';

describe('VoteCastsComponent', () => {
  let component: VoteCastsComponent;
  let fixture: ComponentFixture<VoteCastsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoteCastsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoteCastsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
