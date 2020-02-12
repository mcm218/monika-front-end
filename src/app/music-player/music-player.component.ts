import { Component, OnInit } from "@angular/core";
import {
  faPause,
  faPlay,
  faBackward,
  faForward,
  faVolumeOff,
  faVolumeUp,
  faRandom,
  faUndo,
  faHeart
} from "@fortawesome/free-solid-svg-icons";
import { DbService } from "../db.service";
import { timingSafeEqual } from "crypto";

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
  faHeart = faHeart;
  isFavorited = false;
  volume = 7;
  shuffleMode = false;
  loop = 0;
  song: any;
  pauseState = false;
  queue: any[];
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
        if (this.song.thumbnail.url) {
          this.thumbnail = this.song.thumbnail.url;
        } else {
          this.thumbnail = this.song.thumbnail;
        }
        this.db.checkFavorite(this.song.id).subscribe(doc => {
          if (doc.exists) {
            this.isFavorited = true;
          } else {
            this.isFavorited = false;
          }
        });
      } else {
        this.thumbnail = "";
        this.isFavorited = false;
      }
    });
  }
  toggleFavorite() {
    if (!this.song) {
      return;
    }
    this.isFavorited = !this.isFavorited;
    this.db.toggleFavorite(this.song.id, this.song);
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
  shuffle() {
    // shuffle all but first song
    const song = this.queue.splice(0, 1);
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * i);
      const temp = this.queue[i];
      this.queue[i] = this.queue[j];
      this.queue[j] = temp;
    }
    this.queue.unshift(song[0]);
    this.db.updateQueue(this.queue);
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
