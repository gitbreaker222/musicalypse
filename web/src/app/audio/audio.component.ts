import {Component, ElementRef, OnInit, AfterViewInit, ViewChild, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-audio',
  templateUrl: './audio.component.html',
  styleUrls: ['./audio.component.scss']
})
export class AudioComponent implements OnInit, AfterViewInit {

  source: string;
  volume = 1.0;
  muted = true;
  currentTime;
  duration;
  loading = false;
  playing = false;

  @Output()
  onPlayEnd = new EventEmitter<void>();

  @ViewChild('audioElement')
  private audioElementRef: ElementRef;
  private audioElement: HTMLMediaElement;

  constructor() { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.audioElement = this.audioElementRef.nativeElement;
  }

  seekTo(time: number) {
    this.audioElement.currentTime = time;
    if (!this.isTimeInBuffer(time)) {
      this.loading = true;
    }
  }

  isTimeInBuffer(time: number): boolean {
    for (let i = 0; i < this.audioElement.buffered.length; i++) {
      if (time >= this.audioElement.buffered.start(i) && time <= this.audioElement.buffered.end(i)) {
        return true;
      }
    }
    return false;
  }

  play() {
    this.audioElement.play().then(
      () => {},
      e => {
        console.log(e);
        // TODO deal with errors
      }
    );
  }

  pause() {
    this.audioElement.pause();
  }

  setSource(source: string) {
    if (this.source !== source) {
      this.source = source;
      if (source !== '') {
        this.loading = true;
      } else {
        this.duration = null;
      }
    }
  }

}
