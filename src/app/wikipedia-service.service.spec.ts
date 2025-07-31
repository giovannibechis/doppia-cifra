import { TestBed } from '@angular/core/testing';

import { WikipediaServiceService } from './wikipedia-service.service';

describe('WikipediaServiceService', () => {
  let service: WikipediaServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WikipediaServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
