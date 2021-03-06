import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Title} from '@angular/platform-browser';
import {Action, Store} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';

import {CoreUtils} from '@app/core/core.utils';
import {HttpSocketClientService, SocketMessage} from '@app/core/services/http-socket-client.service';
import {AudioService} from '@app/core/services/audio.service';
import {LoaderService} from '@app/core/services/loader.service';
import {Album, Artist, Track} from '@app/model';

import {LibraryUtils} from './library.utils';
import {AddTracks, LoadTrackFailure, LoadTrackSuccess, RemoveTracks, TracksActionTypes} from './actions/tracks.actions';
import {ArtistsActionTypes} from './actions/artists.actions';
import {DeselectAlbum, DeselectAllAlbums} from './actions/albums.actions';
import {PlayNextTrackInPlaylist} from './actions/player.actions';
import * as fromLibrary from './library.reducers';

import {from, Observable, of} from 'rxjs';
import {catchError, filter, finalize, map, mergeMap, switchMap, take, tap} from 'rxjs/operators';
import {AddToRecent} from '@app/library/actions/recent.actions';

@Injectable()
export class LibraryEffects {

  /**
   * Load tracks from the API
   */
  @Effect()
  loadTracks$: Observable<Action> =
    this.actions$.pipe(
      ofType(TracksActionTypes.LoadTracks),
      tap(() => this.loader.load()),
      switchMap(() =>
        this.httpSocketClient.get('/api/libraries/tracks').pipe(
          map((tracks: Track[]) => tracks.map(LibraryUtils.fixTags)),
          map(tracks => new LoadTrackSuccess(tracks)),
          catchError((error: HttpErrorResponse) => of(new LoadTrackFailure(error.error))),
          finalize(() => this.loader.unload())
        )
      ),
    );

  // TODO move following two effect to reducer
  /**
   * Deselect Albums when Artists selection changes
   */
  @Effect()
  deselectAlbums$: Observable<Action> =
    this.actions$.pipe(
      ofType(
        ArtistsActionTypes.SelectArtists,
        ArtistsActionTypes.SelectArtistsByIds,
        ArtistsActionTypes.DeselectArtist,
      ),
      mergeMap(() =>
        this.store.select(fromLibrary.getSelectedArtists).pipe(take(1))
      ),
      map((artists: Artist[]) => artists.map(a => a.name)),
      mergeMap((artistsNames: string[]) =>
        this.store.select(fromLibrary.getSelectedAlbums).pipe(
          take(1),
          mergeMap((albums: Album[]) =>
            from(
              albums
                .filter(album => artistsNames.indexOf(album.artist) === -1)
                .map(album => new DeselectAlbum(album))
            )
          )
        )
      )
    );

  /**
   * Deselect all Albums when Artists selection is emptied
   */
  @Effect()
  deselectAllAlbums$: Observable<Action> =
    this.actions$.pipe(
      ofType(ArtistsActionTypes.DeselectAllArtists),
      map(() => new DeselectAllAlbums())
    );

  /**
   * Scan tracks (WebSocket)
   */
  @Effect()
  scanTracks$: Observable<Action> =
    this.actions$.pipe(
      ofType(TracksActionTypes.ScanTracks),
      tap(() => this.loader.load()),
      switchMap(() =>
        this.scanTracks().pipe(
          map(tracks => new AddTracks(tracks.map(t => LibraryUtils.fixTags(t)))),
          finalize(() => this.loader.unload())
        )
      )
    );

  /**
   * Play Track
   */
  @Effect()
  playTrack$: Observable<Action> =
    this.store.select(fromLibrary.getCurrentTrack).pipe(
      filter(track => !!track),
      tap(track => this.audioService.play(CoreUtils.resolveUrl(track.url))),
      tap(track => this.titleService.setTitle(`Musicalypse • ${track.metadata.artist} - ${track.metadata.title}`)),
      map(track => new AddToRecent([track]))
    );

  /**
   * Play next track when a song has ended
   */
  @Effect()
  playNextTrack$: Observable<Action> =
    this.audioService.ended$.pipe(
      map(() => new PlayNextTrackInPlaylist())
    );

  /**
   * Subscribe to socket events
   */
  @Effect()
  subscribeToTracks: Observable<Action> =
    this.loader.getSharedSocket().pipe(
      filter(next => (next.method === 'TracksAdded' || next.method === 'TracksDeleted') && next.id === 0),
      map(next => {
        if (next.method === 'TracksAdded') {
          const tracks = next.entity;
          return new AddTracks(tracks.map(track => LibraryUtils.fixTags(track)));
        }
        if (next.method === 'TracksDeleted') {
          const tracks = next.entity;
          return new RemoveTracks(tracks.map(track => LibraryUtils.fixTags(track)));
        }
      })
    );

  constructor(
    private actions$: Actions,
    private httpSocketClient: HttpSocketClientService,
    private store: Store<fromLibrary.State>,
    private titleService: Title,
    private audioService: AudioService,
    private loader: LoaderService
  ) {}

  public scanTracks(): Observable<Track[]> {
    return Observable.create((observer) => {
      const currentId = ++this.httpSocketClient.id;
      const subscription1 = this.httpSocketClient
        .getSocket()
        .pipe(
          filter((r: SocketMessage) => r.method === 'TracksAdded' && r.id === currentId),
          map((r: SocketMessage) => r.entity),
          map((e: Track) => e)
        )
        .subscribe(
          next => observer.next(next),
          error => observer.error(error)
        );
      const subscription2 = this.httpSocketClient
        .getSocket()
        .pipe(
          filter((r: SocketMessage) => (r.method === 'LibraryScanned' || r.method === 'LibraryScannedFailed') && r.id === currentId),
          take(1)
        )
        .subscribe((n: SocketMessage) => {
          if (n.method === 'LibraryScanned') {
            observer.complete();
          } else {
            observer.error(n.entity);
          }
        });
      this.httpSocketClient.send({method: 'ScanLibrary', id: currentId, entity: null});
      return () => {
        subscription1.unsubscribe();
        subscription2.unsubscribe();
      };
    });
  }

}
