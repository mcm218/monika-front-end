import { Component, OnInit } from "@angular/core";
import {
  faPause,
  faPlay,
  faBackward,
  faForward,
  faVolumeOff,
  faVolumeUp,
  faRandom,
  faUndo
} from "@fortawesome/free-solid-svg-icons";
import { DbService } from "../db.service";

@Component({
  selector: "app-music-player",
  templateUrl: "./music-player.component.html",
  styleUrls: ["./music-player.component.css"]
})
export class MusicPlayerComponent implements OnInit {
  faPause = faPause;
  faPlay = faPlay;
  faBackward = faBackward;
  faForward = faForward;
  faVolumeOff = faVolumeOff;
  faVolumeUp = faVolumeUp;
  faRandom = faRandom;
  faLoop = faUndo;
  volume = 7;
  shuffleMode = false;
  loop = 0;
  song: any;
  pauseState = false;
  queue: any;
  key = 0;
  thumbnail: string = "";
  constructor(private db: DbService) {}

  ngOnInit() {
    this.getGuild();
  }

  getGuild() {
    this.db.guildObvservable.subscribe(_ => {
      this.getCurrentSong();
      this.getController();
    });
  }

  getCurrentSong() {
    this.db.getQueue().subscribe(doc => {
      if (!doc.payload.data()) {
        return;
      }
      this.queue = doc.payload.data().queue;
      this.song = this.queue[0];
      if (this.song) {
        this.thumbnail = this.song.thumbnail;
      } else {
        this.thumbnail = "";
      }
    });
  }

  getController() {
    this.db.getController().subscribe(doc => {
      let controller = doc.payload.data();
      this.volume = controller.volume;
      this.shuffleMode = controller.shuffleMode;
      this.loop = controller.loop;
      this.pauseState = controller.pauseState;
    });
  }
  toggleShuffleMode() {
    this.shuffleMode = !this.shuffleMode;
    this.updateController();
  }
  toggleLoop() {
    this.loop++;
    if (this.loop > 2) {
      this.loop = 0;
    }
    this.updateController();
  }
  skip() {
    if (!this.queue) {
      return;
    }
    this.queue.splice(0, 1);
    this.db.updateQueue(this.queue);
  }
  togglePause() {
    this.pauseState = !this.pauseState;
    this.updateController();
  }

  updateController() {
    this.db.updateController({
      volume: this.volume,
      shuffleMode: this.shuffleMode,
      loop: this.loop,
      pauseState: this.pauseState
    });
  }
}
