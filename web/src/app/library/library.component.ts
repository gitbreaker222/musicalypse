import {AfterViewInit, ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {AudioService} from '../core/services/audio.service';
import {Album, Artist, Playlist, Track} from '../model';
import {LibraryService} from './services/library.service';

import * as _ from 'lodash';
import {Observable, Subscription} from 'rxjs';
import {take} from 'rxjs/operators';

@Component({
  selector: 'app-library',
  template: `
    <div class="container">
      <div class="content"
           [ngClass]="'t' + contentTranslation"
           [class.no-track]="!(currentTrack$ | async)"
           [class.no-animation]="noAnimation">
        <div class="column a1">
          <app-artists #artistsComponent
                       [artists]="artists$ | async"
                       [selectedArtists]="selectedArtists$ | async"
                       [displayType]="displayType"
                       (next)="translateContent(1)">
          </app-artists>
        </div>
        <div class="column a2">
          <app-albums #albumsComponent
                      [albums]="albums$ | async"
                      [selectedAlbums]="selectedAlbums$ | async"
                      [displayType]="displayType"
                      (next)="translateContent(2)"
                      (previous)="translateContent(0)">
          </app-albums>
        </div>
        <div class="column a3">
          <app-tracks #tracksComponent
                      (next)="translateContent(3)"
                      (previous)="translateContent(1)"
                      [tracks]="tracks$ | async"
                      [currentTrack]="currentTrack$ | async">
          </app-tracks>
        </div>
        <div class="column a4">
          <app-library-player [currentTrack]="currentTrack$ | async"
                              [playlist]="playlist$ | async"
                              [playlists]="playlists$ | async"
                              [muted]="audioService.muted$ | async"
                              [volume]="audioService.volume$ | async"
                              [playing]="audioService.playing$ | async"
                              [shuffle]="shuffle$ | async"
                              [repeat]="repeat$ | async"
                              (previous)="translateContent(2)">
          </app-library-player>
        </div>
        <app-mini-player [currentTrack]="currentTrack$ | async"
                         [playlist]="playlist$ | async"
                         [muted]="audioService.muted$ | async"
                         [volume]="audioService.volume$ | async"
                         [duration]="audioService.duration$ | async"
                         [currentTime]="audioService.currentTime$ | async"
                         [playing]="audioService.playing$ | async"
                         [loading]="audioService.loading$ | async"
                         (next)="translateContent(3)">
        </app-mini-player>
      </div>
    </div>
  `,
  styleUrls: ['./library.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryComponent implements OnInit, OnDestroy, AfterViewInit {

  artists$: Observable<Artist[]>;
  selectedArtists$: Observable<Artist[]>;
  albums$: Observable<Album[]>;
  selectedAlbums$: Observable<Album[]>;
  tracks$: Observable<Track[]>;
  currentTrack$: Observable<Track>;
  playlist$: Observable<Track[]>;
  playlists$: Observable<Playlist[]>;
  shuffle$: Observable<boolean>;
  repeat$: Observable<boolean>;

  subscriptions: Subscription[] = [];

  // urlData: Object = {};

  contentTranslation = 0;
  displayType: DisplayType;

  noAnimation = false;
  private animationTimeout;

  constructor(
    private router: Router,
    public audioService: AudioService,
    private library: LibraryService,
    private route: ActivatedRoute
  ) {

  }

  @HostListener('window:resize') onResize() {
    this.noAnimation = true;
    clearTimeout(this.animationTimeout);
    this.animationTimeout = setTimeout(() => this.noAnimation = false, 200);
  }

  // updateUrlDataFromArtists(artists: Artist[]) {
  //   if (artists.length === 0) {
  //     delete this.urlData['artists'];
  //   } else {
  //     const artistsData = _.map(artists, artist => artist.name.replace(',', '%c%').replace('&', '%a%'));
  //     this.urlData['artists'] = _.sortBy(artistsData);
  //   }
  // }
  //
  // updateUrlDataFromAlbums(albums: Album[]) {
  //   if (albums.length === 0) {
  //     delete this.urlData['albums'];
  //   } else {
  //     const albumData = _.map(albums, album => album.title.replace(',', '%c%').replace('&', '%a%'));
  //     this.urlData['albums'] = _.sortBy(albumData);
  //   }
  // }

  // updateState(routeParam: ParamMap) {
  //   if (routeParam.has('t')) {
  //     this.contentTranslation = +routeParam.get('t');
  //   } else {
  //     this.contentTranslation = 0;
  //   }
  //   if (routeParam.has('artists')) {
  //     const artists = routeParam
  //       .get('artists')
  //       .split(',')
  //       .map(v => v.replace('%c%', ',').replace('%a%', '&'));
  //     this.library.selectArtistsByName(artists);
  //   } else {
  //     this.library.deselectAllArtists();
  //   }
  //   if (routeParam.has('albums')) {
  //     const artists = routeParam
  //       .get('albums')
  //       .split(',')
  //       .map(v => v.replace('%c%', ',').replace('%a%', '&'));
  //     this.library.selectAlbumsByName(artists);
  //   } else {
  //     this.library.deselectAllAlbums();
  //   }
  // }

  ngOnInit() {

    this.route.data.pipe(
      take(1),
    ).subscribe(data => {
      if (data.favorites) {
        this.displayType = DisplayType.Favorites;
        this.artists$ = this.library.getFavoriteArtists();
        this.albums$  = this.library.getFavoriteAlbums();
        this.tracks$  = this.library.getDisplayedFavorites();
      } else if (data.recent) {
        this.displayType = DisplayType.Recent;
        this.artists$ = this.library.getRecentArtists();
        this.albums$  = this.library.getRecentAlbums();
        this.tracks$  = this.library.getDisplayedRecentTracks();
      } else {
        this.displayType = DisplayType.Default;
        this.artists$ = this.library.getAllArtists();
        this.albums$  = this.library.getDisplayedAlbums();
        this.tracks$  = this.library.getDisplayedTracks();
      }
    });

    this.selectedArtists$ = this.library.getSelectedArtists();
    this.selectedAlbums$  = this.library.getSelectedAlbums();
    this.currentTrack$    = this.library.getCurrentTrack();
    this.shuffle$         = this.library.getShuffle();
    this.repeat$          = this.library.getRepeat();
    this.playlist$        = this.library.getPlaylist();
    this.playlists$       = this.library.getPlaylists();

    // Update the url based on the library state
    // if (this.library.selectedArtists.length > 0) {
    //   this.updateUrlDataFromArtists(this.library.selectedArtists);
    //   this.updateUrlDataFromAlbums(this.library.selectedAlbums);
    //   this.updateUrl();
    // }

    // When tracks are updated (e.g. on first visit) update the state based on the url
    // this.subscriptions.push(
    //   this.library.onTracksUpdated.subscribe(() => {
    //     this.route.paramMap.take(1).subscribe(params => this.updateState(params));
    //   })
    // );

    // Update the state on url change
    // this.subscriptions.push(
    //   this.route.paramMap.skip(1).subscribe(params => this.updateState(params))
    // );

    // On artist selection change update url
    // this.subscriptions.push(
    //   this.library.onArtistSelectionChanged.subscribe((artists) => {
    //     this.updateUrlDataFromArtists(artists);
    //     this.updateUrl();
    //   })
    // );

    // On album selection change update url
    // this.subscriptions.push(
    //   this.library.onAlbumSelectionChanged.subscribe(albums => {
    //     this.updateUrlDataFromAlbums(albums);
    //     this.updateUrl();
    //   })
    // );

    // // Restore selection state
    // const savedSelectedArtistsIds = PersistenceService.load('selectedArtistsIds');
    // if (savedSelectedArtistsIds) {
    //   this.store.dispatch(new SelectArtistsByIds(JSON.parse(savedSelectedArtistsIds)));
    // }
    // const savedSelectedAlbumsIds = PersistenceService.load('selectedAlbumsIds');
    // if (savedSelectedAlbumsIds) {
    //   this.store.dispatch(new SelectAlbumsByIds(JSON.parse(savedSelectedAlbumsIds)));
    // }
    //
    // // Save selection state on change
    // this.subscriptions.push(
    //   this.store.select(fromLibrary.getSelectedArtistsIds).subscribe(
    //     ids => PersistenceService.save('selectedArtistsIds', JSON.stringify(ids))
    //   ),
    //   this.store.select(fromLibrary.getSelectedAlbumsIds).subscribe(
    //     ids => PersistenceService.save('selectedAlbumsIds', JSON.stringify(ids))
    //   )
    // );


  }

  ngAfterViewInit() {

  }

  ngOnDestroy() {
    _.forEach(this.subscriptions, sub => sub.unsubscribe());
  }

  // updateUrl() {
  //   const finalData = this.contentTranslation > 0 ? _.merge({t: this.contentTranslation}, this.urlData) : this.urlData;
  //   this.router.navigate(['/library', finalData]);
  // }

  translateContent(n: number) {
    this.contentTranslation = n;
    // this.updateUrl();
  }

}

export enum DisplayType {
  Default,
  Favorites,
  Recent
}
