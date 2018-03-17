import {Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {MatSidenav, MatSnackBar} from '@angular/material';
import {OverlayContainer} from '@angular/cdk/overlay';
import {AudioComponent} from './audio/audio.component';
// import {BreakpointObserver} from '@angular/cdk/layout';
import { Track, SocketMessage } from './model';
import {HttpSocketClientService} from './services/http-socket-client.service';
import {LibraryService} from './services/library.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {

  @ViewChild('sidenav')
  sidenav: MatSidenav;

  @ViewChild(AudioComponent)
  audio: AudioComponent;

  themeClass = 'dark-theme';

  // isSmallScreen: boolean;

  private id = 0;

  constructor(
    // private breakpointObserver: BreakpointObserver
    private overlayContainer: OverlayContainer,
    public httpSocketClient: HttpSocketClientService,
    public library: LibraryService,
    public snackBar: MatSnackBar
  ) {
    overlayContainer.getContainerElement().classList.add(this.themeClass);
  }

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
    // this.sidenav.open();
    // this.openSocket();
  }

  ngAfterViewInit(): void {

  }

  changeTheme(theme: string) {
    this.overlayContainer.getContainerElement().classList.remove(this.themeClass);
    this.overlayContainer.getContainerElement().classList.add(theme);
    this.themeClass = theme;
  }

  scanLibrary() {
    this.library.reset();
    const snackBar = this.snackBar.open('Scanning library...');
    const currentId = ++this.id;
    const subscription1 = this.httpSocketClient
      .openSocket()
      .filter((r: SocketMessage) => r.method === 'TrackAdded' && r.id === currentId)
      .map((r: SocketMessage) => r.entity)
      .map((e: Track) => e)
      .subscribe(
        track => this.library.addTrack(track),
        error => {
          console.log(error);
          snackBar.dismiss();
          this.snackBar.open('An error occurred');
        }
      );

    this.httpSocketClient
      .openSocket()
      .filter((r: SocketMessage) => r.method === 'LibraryScanned' && r.id === currentId)
      .take(1)
      .subscribe(() => {
        snackBar.dismiss();
        subscription1.unsubscribe();
      });

    this.httpSocketClient.send({method: 'ScanLibrary', id: currentId, entity: null});
  }

  onPlayEnded() {
    // if repeat is on or it is not the last song
    if (this.library.playlist.length > 0 && (this.library.repeat || !this.library.isCurrentTrackLastInPlaylist())) {
      this.library.playNextTrackInPlaylist();
    } else {
      this.library.currentTrack = null;
      this.audio.setSource('');
    }
  }

}
