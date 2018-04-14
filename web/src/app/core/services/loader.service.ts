import { Injectable } from '@angular/core';

@Injectable()
export class LoaderService {

  loadings = 0;

  constructor() { }

  isLoading() {
    return this.loadings > 0;
  }

  load() {
    this.loadings += 1;
  }

  unload() {
    this.loadings -= 1;
  }

}