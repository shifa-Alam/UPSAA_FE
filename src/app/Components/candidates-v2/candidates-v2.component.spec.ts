import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidatesV2Component } from './candidates-v2.component';

describe('CandidatesV2Component', () => {
  let component: CandidatesV2Component;
  let fixture: ComponentFixture<CandidatesV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidatesV2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidatesV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
