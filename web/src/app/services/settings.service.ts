import {Injectable, OnDestroy} from '@angular/core';
import {OverlayContainer} from '@angular/cdk/overlay';
import {HttpEvent, HttpEventType} from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';
import {MatSnackBar} from '@angular/material';
import {HttpSocketClientService} from './http-socket-client.service';
import {Subscription} from 'rxjs/Subscription';
import {LoaderService} from './loader.service';
import * as _ from 'lodash';

@Injectable()
export class SettingsService implements OnDestroy {

  libraryFolders: string[] = [];

  themes: Theme[] = [
    {name: 'Dark Theme', cssClass: 'dark-theme', color: '#212121'},
    {name: 'Light Theme', cssClass: 'light-theme', color: '#F5F5F5'},
    {name: 'Blue Theme', cssClass: 'blue-theme', color: '#263238'},
    {name: 'Pink Theme', cssClass: 'pink-theme', color: '#F8BBD0'}
  ];

  featuredThemes: Theme[] = this.themes;

  currentTheme: Theme = this.themes[0];

  uploadSubscription: Subscription;

  files: { _file: File, progress: number }[] = [];

  warnOnMissingTags = false;

  constructor(
    private overlayContainer: OverlayContainer,
    private sanitizer: DomSanitizer,
    public httpSocketClient: HttpSocketClientService,
    public snackBar: MatSnackBar,
    public loader: LoaderService
  ) {
    overlayContainer.getContainerElement().classList.add(this.currentTheme.cssClass);
  }

  ngOnDestroy(): void {
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe();
    }
  }

  getThemeStyle(theme: Theme) {
    return this.sanitizer.bypassSecurityTrustStyle(`background-color: ${theme.color}`);
  }

  isUploading(): boolean {
    return this.uploadSubscription != null;
  }

  cancelUpload() {
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe();
      this.uploadSubscription = null;
      this.files = [];
      this.snackBar.open('Upload has been canceled.', '', {duration: 2000});
    }
  }

  clearUploads() {
    if (!this.uploadSubscription) {
      this.files = [];
    }
  }

  uploadFiles() {
    if (this.uploadSubscription) {
      throw new Error('An upload is already in progress!');
    }
    const files: File[] = _.map(this.files, '_file');
    // TODO filter out files with progress below 100%
    this.uploadSubscription = this.httpSocketClient.postFiles('/api/upload', files).subscribe(
      (next: { event: HttpEvent<any>, file?: File } | null) => {
        switch (next.event.type) {
          case HttpEventType.Sent:
            break;
          case HttpEventType.UploadProgress:
            const currentFile: { _file: File, progress: number } =
              _.filter(this.files, f => f._file === next.file)[0];
            currentFile.progress = next.event.loaded / next.event.total * 100;
            break;
          case HttpEventType.ResponseHeader:
            break;
          case HttpEventType.DownloadProgress:
            break;
          case HttpEventType.Response:
            break;
        }
      },
      error => {
        this.snackBar.open(`An error occurred!`, '', {duration: 2000});
        console.log(error);
        this.uploadSubscription.unsubscribe();
        this.uploadSubscription = null;
        // this.files = [];
      },
      () => {
        this.snackBar.open(`${this.files.length} file(s) uploaded successfully.`, '', {duration: 2000});
        this.uploadSubscription.unsubscribe();
        this.uploadSubscription = null;
        this.files = [];
      }
    );
  }

  changeTheme(theme: Theme) {
    this.overlayContainer.getContainerElement().classList.remove(this.currentTheme.cssClass);
    this.overlayContainer.getContainerElement().classList.add(theme.cssClass);
    this.currentTheme = theme;
  }

  addLibraryFolder(folder: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpSocketClient.post('/api/libraries', folder).subscribe(
        () => {
          this.libraryFolders.push(folder);
          resolve();
        },
        error => {
          console.log(error);
          reject(error);
        }
      );
    });
  }

  removeLibraryFolder(folder: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpSocketClient._delete('/api/libraries/' + encodeURIComponent(folder)).subscribe(
        () => {
          this.libraryFolders = _.filter(this.libraryFolders, lib => lib !== folder);
          resolve();
        },
        error => {
          console.log(error);
          reject(error);
        }
      );
    });
  }

}

export class Theme {
  name: string;
  cssClass: string;
  color: string;
}
