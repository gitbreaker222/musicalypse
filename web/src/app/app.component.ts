import {Component, OnInit, ViewChild} from '@angular/core';
import * as Material from '@angular/material';
// import {BreakpointObserver} from '@angular/cdk/layout';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild('sidenav')
  sidenav: Material.MatSidenav;

  artists: string[] = [
    'Orelsan',
    'IAM',
    'Metallica'
  ];

  albums: string[] = [
    'The Black album',
    'Death Magnetic'
  ];

  tracks: string[] = [
    'That Was Just Your Life',
    'The End Of The Line',
    'Broken, Beat and Scarred',
    'The Day That Never Comes',
    'All Nightmare Long',
    'Cyanide',
    'The Unforgiven III'
  ];

  // isSmallScreen: boolean;

  constructor(
    // private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
/*    this.breakpointObserver.observe('(max-width: 960px)').subscribe(result => {
      if (result.matches) {
        this.isSmallScreen = true;
        this.sidenav.close();
      } else {
        this.isSmallScreen = false;
        this.sidenav.open();
      }
    });*/
  }

}
