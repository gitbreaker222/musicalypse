import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {LibraryService} from '../../services/library.service';
import {AudioComponent} from '@app/core/components/audio/audio.component';
import {Track} from '@app/model';

@Component({
  selector: 'app-mini-player',
  templateUrl: './mini-player.component.html',
  styleUrls: ['./mini-player.component.scss']
})
export class MiniPlayerComponent implements OnInit {

  @Output()
  next: EventEmitter<void> = new EventEmitter();

  audio: AudioComponent;

  constructor(
    public library: LibraryService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.audio = this.library.audio;
  }

  getAvatarStyle(track: Track) {
    return track && track.coverUrl ? this.sanitizer.bypassSecurityTrustStyle(`background-image: url("${track.coverUrl}")`) : '';
  }

}