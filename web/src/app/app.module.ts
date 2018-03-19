import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HttpClientModule} from '@angular/common/http';
import * as Material from '@angular/material';
import {BreakpointObserver, MediaMatcher} from '@angular/cdk/layout';

import {AppComponent} from './app.component';
import {AudioComponent} from './audio/audio.component';
import {TimePipe} from './pipes/time.pipe';
import {HttpSocketClientService} from './services/http-socket-client.service';
import {LibraryService} from './services/library.service';
import {PlayerComponent} from './library/player/player.component';
import {ArtistsComponent} from './library/artists/artists.component';
import {AlbumsComponent} from './library/albums/albums.component';
import {TracksComponent} from './library/tracks/tracks.component';
import {FormsModule} from '@angular/forms';
import {SearchPipe} from './pipes/search.pipe';
import {FavoritesService} from './services/favorites.service';
import {DetailsComponent} from './dialogs/details/details.component';
import {FolderComponent} from './dialogs/folder/folder.component';
import {RouterModule, Routes} from '@angular/router';
import {LibraryComponent} from './library/library.component';
import {AboutComponent} from './about/about.component';
import {SettingsComponent} from './settings/settings.component';
import {FileSizePipe} from './pipes/file-size.pipe';
import {SettingsService} from './services/settings.service';

const appRoutes: Routes = [
  { path: '', component: LibraryComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'about', component: AboutComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    AudioComponent,
    TimePipe,
    PlayerComponent,
    ArtistsComponent,
    AlbumsComponent,
    TracksComponent,
    SearchPipe,
    DetailsComponent,
    FolderComponent,
    LibraryComponent,
    AboutComponent,
    SettingsComponent,
    FileSizePipe
  ],
  entryComponents: [
    DetailsComponent,
    FolderComponent
  ],
  imports: [
    RouterModule.forRoot(appRoutes/*, { enableTracing: true }*/),
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    Material.MatRadioModule,
    Material.MatSlideToggleModule,
    Material.MatGridListModule,
    Material.MatDialogModule,
    Material.MatSnackBarModule,
    Material.MatButtonModule,
    Material.MatProgressSpinnerModule,
    Material.MatProgressBarModule,
    Material.MatTabsModule,
    Material.MatFormFieldModule,
    Material.MatSelectModule,
    Material.MatInputModule,
    Material.MatSliderModule,
    Material.MatListModule,
    Material.MatTooltipModule,
    Material.MatCheckboxModule,
    Material.MatMenuModule,
    Material.MatSidenavModule,
    Material.MatToolbarModule,
    Material.MatIconModule
  ],
  providers: [
    MediaMatcher,
    BreakpointObserver,
    HttpSocketClientService,
    LibraryService,
    FavoritesService,
    SettingsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
