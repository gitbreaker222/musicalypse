import {ChangeDetectionStrategy, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material';
import {FolderComponent} from '../shared/dialogs/folder/folder.component';
import {HttpSocketClientService} from '../core/services/http-socket-client.service';
import {SettingsService} from './services/settings.service';
import {ConfirmComponent} from '../shared/dialogs/confirm.component';
import {environment} from '@env/environment';
import {select, Store} from '@ngrx/store';
import * as fromSettings from './settings.reducers';
import {Observable} from 'rxjs';
import {map, share} from 'rxjs/operators';
import {AddLibraryFolder, LoadLibraryFolders, RemoveLibraryFolder} from './settings.actions';
import * as LayoutActions from '../core/core.actions';
import * as fromRoot from '../app.reducers';
import {ScanTracks} from '../library/actions/tracks.actions';
import {CoreUtils, Theme} from '../core/core.utils';

@Component({
  selector: 'app-settings',
  template: `
    <div class="wrapper">
      <div class="settings">
        <h2>Settings</h2>
        <h3 class="secondary-text library">
          Library
          <mat-spinner [diameter]="16" *ngIf="loading$ | async"></mat-spinner>
        </h3>
        <p>
          Specify which folders contain your music and make up your library.<br>
          Currently we are watching the following folder(s):
        </p>
        <app-library-folders [folders]="libraryFolders$ | async"
                             [error]="error$ | async"
                             (addFolder)="addFolderDialog()"
                             (removeFolder)="removeFolderDialog($event)"
                             (scanRequest)="requestLibraryScan()">
        </app-library-folders>
        <mat-divider></mat-divider>
        <!--<h3 class="secondary-text">Upload</h3>
        <app-uploads [files]="settings.files"
                     [isUploading]="settings.isUploading()"
                     (addFiles)="addFiles($event)"
                     (uploadFiles)="settings.uploadFiles()"
                     (cancelUploads)="settings.cancelUpload()"
                     (clearUploads)="settings.clearUploads()">
        </app-uploads>
        <mat-divider></mat-divider>-->
        <h3 class="secondary-text">Theme</h3>
        <app-themes [themes]="themes"
                    [currentTheme]="currentTheme$ | async"
                    (changeTheme)="changeTheme($event)">
        </app-themes>
        <mat-divider></mat-divider>
        <!--<h3 class="secondary-text">Misc</h3>
        <div>
          <button mat-button>
            <mat-icon>{{ httpSocketClient.isSocketOpen() ? 'radio_button_checked' : 'radio_button_unchecked' }}</mat-icon>
            <span> WebSocket</span>
          </button>
        </div>-->
        <!--<div>-->
        <!--<mat-slide-toggle>Watch library folders</mat-slide-toggle>-->
        <!--</div>-->
        <!--<div>
          <mat-slide-toggle matTooltip="Displays a warning icon next to artists, albums, tracks that have missing or incomplete tags."
                            [(ngModel)]="settings.warnOnMissingTags">
            Warn on missing tags
          </mat-slide-toggle>
        </div>-->
        <!--<div>-->
        <!--<mat-slide-toggle>Misc 2</mat-slide-toggle>-->
        <!--</div>-->
        <!--<div>-->
        <!--<mat-slide-toggle>Misc 3</mat-slide-toggle>-->
        <!--</div>-->
        <!--<mat-divider></mat-divider>-->
        <div *ngIf="isElectron">
          <h3 class="secondary-text">Streaming</h3>
          <p>
            You can stream your music to your home devices on your local network by connecting to:
          </p>
          <div *ngIf="hostIps$ | async; let ips">
            <ul>
              <li *ngFor="let ip of ips">
                <a [href]="'http://' + ip + ':8080'" (click)="openExternally($event)" target="_blank">{{ 'http://' + ip + ':8080' }}</a>
              </li>
            </ul>
            <span *ngIf="ips.length === 0">No network connection detected.</span>
          </div>
          <mat-divider></mat-divider>
        </div>
        <h3 class="secondary-text">Cache</h3>
        <p>
          Musicalypse stores some data in a local cache.<br>
          If you experience any issue or want a clean slate you can clear your cache here.
        </p>
        <ul class="cache">
          <li>
            <mat-checkbox color="primary" [(ngModel)]="cache_favorites">Favorites</mat-checkbox>
          </li>
          <li>
            <mat-checkbox color="primary" [(ngModel)]="cache_recent">Recent tracks</mat-checkbox>
          </li>
          <li>
            <mat-checkbox color="primary" [(ngModel)]="cache_playlist">Current playlist</mat-checkbox>
          </li>
          <li>
            <mat-checkbox color="primary" [(ngModel)]="cache_playlists">Saved playlists</mat-checkbox>
          </li>
          <li>
            <mat-checkbox color="primary" [(ngModel)]="cache_theme">Theme</mat-checkbox>
          </li>
          <li>
            <mat-checkbox color="primary" [(ngModel)]="cache_covers">Covers <em>(requires library scan afterwards)</em></mat-checkbox>
          </li>
        </ul>
        <button mat-button
                class="clear"
                (click)="clearCache()"
                [disabled]="!(
                  cache_theme ||
                  cache_playlists ||
                  cache_playlist ||
                  cache_recent ||
                  cache_favorites ||
                  cache_covers)">
          Clear selected
        </button>
      </div>
    </div>
  `,
  styles: [`
    .wrapper {
      display: flex;
      width: 100%;
      box-sizing: border-box;
    }
    .settings {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      max-width: 900px;
      width: 100%;
      padding: 0.5rem 1rem;
    }
    mat-spinner {
      margin-left: 0.5rem;
    }
    h3.library {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    mat-divider {
      margin: 1rem 0;
    }
    .cache {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .cache li {
      list-style: none;
      padding-left: 1rem;
      margin-bottom: 1rem;
    }
    button.clear {
      max-width: 8rem;
    }
    @media screen and (max-width: 598px){
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit, OnDestroy {

  isElectron = environment.electron;

  themes = CoreUtils.allThemes;

  cache_favorites = false;
  cache_recent = false;
  cache_playlist = false;
  cache_playlists = false;
  cache_theme = false;
  cache_covers = false;

  error$: Observable<string>;
  loading$: Observable<boolean>;
  libraryFolders$: Observable<string[]>;
  // libraryFoldersLength$: Observable<number>;
  currentTheme$: Observable<Theme>;
  hostIps$: Observable<string[]>;

  ipcAddFolder = (event, folder) => this.zone.run(() => this.addLibraryFolder(folder[0]));

  constructor(
    public settings: SettingsService,
    private dialog: MatDialog,
    private router: Router,
    private store: Store<fromSettings.State>,
    private zone: NgZone,
    private httpSocketClient: HttpSocketClientService
  ) {
    this.error$ = this.store.pipe(select(fromSettings.getSettingsError));
    this.loading$ = this.store.pipe(select(fromSettings.getSettingsLoading));
    this.libraryFolders$ = this.store.pipe(select(fromSettings.getLibraryFolders));
    this.currentTheme$ = this.store.pipe(select(fromRoot.getCurrentTheme));
    // this.libraryFoldersLength$ = this.libraryFolders$.pipe(map(f => f.length));
    this.hostIps$ = this.httpSocketClient.get('/api/host').pipe(
      map((response: string[]) => response),
      share()
    );
  }

  ngOnInit() {
    this.store.dispatch(new LoadLibraryFolders());

    if (environment.electron) {
      const ipc = (<any>window).require('electron').ipcRenderer;
      ipc.on('selected-directory', this.ipcAddFolder);
    }
  }

  ngOnDestroy(): void {
    if (environment.electron) {
      const ipc = (<any>window).require('electron').ipcRenderer;
      ipc.removeListener('selected-directory', this.ipcAddFolder);
    }
  }

  addLibraryFolder(folder: string) {
    this.store.dispatch(new AddLibraryFolder(folder));
   }

  removeLibraryFolder(folder: string) {
    this.store.dispatch(new RemoveLibraryFolder(folder));
  }

  /*addFiles(files: FileList) {
    if (!this.settings.isUploading()) {
      const names = _.map(this.settings.files, f => f._file.name);
      _.forEach(files, (file: File) => {
        if (!_.includes(names, file.name) && file.name.endsWith('.mp3')) {
          this.settings.files.push({_file: file, progress: 0});
        }
      });
    }
  }*/

  addFolderDialog() {
    if (environment.electron) {
      const ipc = (<any>window).require('electron').ipcRenderer;
      ipc.send('open-file-dialog');
    } else {
      const dialogRef = this.dialog.open(FolderComponent, {
        minWidth: '400px'
      });
      dialogRef.afterClosed().subscribe(folder => {
        if (folder) {
          this.addLibraryFolder(folder);
        }
      });
    }
  }

  removeFolderDialog(folder: string) {
    const dialogRef = this.dialog.open(ConfirmComponent, {
      minWidth: '400px',
      data: {
        title: 'Please confirm',
        message: 'Are you sure you want to remove the folder "' + folder + '" from the library?'
      }
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.removeLibraryFolder(folder);
      }
    });
  }

  requestLibraryScan() {
    this.router.navigate(['/']); // .then(() => this.library.scan());
    this.store.dispatch(new ScanTracks());
  }

  changeTheme(theme: Theme) {
    this.store.dispatch(new LayoutActions.ChangeTheme(theme));
  }

  openExternally(event: Event) {
    if (this.isElectron) {
      const shell = (<any>window).require('electron').shell;
      shell.openExternal(event.srcElement.getAttribute('href'));
      event.preventDefault();
    }
  }

  clearCache() {
    if (this.cache_favorites) {
      console.log('clearing favorites');
      CoreUtils.save('favorites', JSON.stringify([]));
    }
    if (this.cache_recent) {
      console.log('clearing recent tracks');
      CoreUtils.save('recent', JSON.stringify([]));
    }
    if (this.cache_playlist) {
      console.log('clearing current playlist');
      CoreUtils.save('playlist', JSON.stringify([]));
      CoreUtils.remove('current');
    }
    if (this.cache_playlists) {
      console.log('clearing playlists');
      CoreUtils.save('playlists', JSON.stringify([]));
    }
    if (this.cache_theme) {
      console.log('clearing saved theme');
      CoreUtils.remove('theme');
    }
    if (this.cache_covers) {
      console.log('clearing covers');
      this.httpSocketClient.delete('/api/covers').subscribe();
    }
    this.dialog.open(
      ConfirmComponent,
      { data: {
        title: 'Cache cleared!',
        message: 'You have cleared your cache. You should reload Musicalypse for it to take effect. Reload now?'
      }}
    ).afterClosed()
      .subscribe(
        reload => {
          if (reload) {
            if (environment.electron) {
              const currentWindow = (<any> window).require('electron').remote.getCurrentWindow();
              currentWindow.loadURL(document.location.toString() + '/../index.html');
            } else {
              document.location.reload();
            }
          }
        }
      );
  }

}
