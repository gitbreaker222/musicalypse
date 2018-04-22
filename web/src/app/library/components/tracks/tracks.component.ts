import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material';
import {Track} from '@app/model';
import {LibraryService} from '../../services/library.service';
import {SettingsService} from '@app/settings/services/settings.service';
import {FavoritesService} from '../../services/favorites.service';
import {DetailsComponent} from '@app/shared/dialogs/details/details.component';
import {Subscription} from 'rxjs';
import * as _ from 'lodash';
import {AudioService} from '@app/core/services/audio.service';

@Component({
  selector: 'app-tracks',
  templateUrl: './tracks.component.html',
  styleUrls: ['./tracks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TracksComponent implements OnInit, OnDestroy {

  @Output() next: EventEmitter<void> = new EventEmitter();
  @Output() previous: EventEmitter<void> = new EventEmitter();

  // @Input() selectedAlbums: Album[];
  @Input() tracks: Track[];

  @ViewChild('list')
  list: ElementRef;

  showSearch = false;
  search = '';

  filter: (track: Track) => boolean = ((track: Track) => {
    if (this.search !== '') {
      return track.metadata.title.toLowerCase().includes(this.search.toLowerCase());
    }
    return true;
  });

  private subscriptions: Subscription[] = [];

  constructor(
    public library: LibraryService,
    public favorites: FavoritesService,
    public dialog: MatDialog,
    public settings: SettingsService,
    public audioService: AudioService
  ) { }

  ngOnInit() {}

  ngOnDestroy(): void {
    _.forEach(this.subscriptions, sub => sub.unsubscribe());
  }

  trackByURL(index: number, track: Track) {
    return track.url;
  }

  // isMultipleAlbumsSelected(): boolean {
  //   return this.selectedAlbums.length > 1;
  // }

  // addAllToPlaylist() {
  //   this.library.addTracksToPlaylist(this.filteredTracks);
  //   const tracks = this.filteredTracks.length > 1 ? 'tracks' : 'track';
  //   this.snackBar.open(`${this.filteredTracks.length} ${tracks} added to current playlist`, '', { duration: 1500 });
  // }

  // addTrackToPlaylist(track: Track) {
  //   this.library.addTrackToPlaylist(track);
  //   this.snackBar.open('Track added to current playlist', '', { duration: 1500 });
  // }

  openDetailsDialog(track: Track) {
    const dialogRef = this.dialog.open(DetailsComponent, {
      // maxWidth: '500px',
      data: { track: track }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log(result);
      // this.animal = result;
    });
  }

  scrollTo(letter: string) {
    const scrollOptions = {block: 'start', inline: 'nearest', behavior: 'smooth'};
    if (letter === '#') {
      this.list.nativeElement.getElementsByClassName('track')[0].scrollIntoView(scrollOptions);
      return;
    }
    const elem = _.find(this.list.nativeElement.getElementsByClassName('track'), artist => {
      return artist.getElementsByClassName('track-name')[0].innerText.toLowerCase().startsWith(letter.toLowerCase());
    });
    if (elem) {
      elem.scrollIntoView(scrollOptions);
    }
  }

  play() {
    this.audioService.resume();
  }

  pause() {
    this.audioService.pause();
  }

}
