import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {LibraryService} from '../../services/library.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
  }

  cancel() {
    this.dialogRef.close();
  }

  download() {
    // TODO move getAudioComponent elsewhere. refactor with PlayerComponent.getAudioUrl
    window.open(LibraryService.getAudioUrl(this.data.track.url), '_blank');
  }

}

