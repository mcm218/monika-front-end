import { Component, OnInit } from "@angular/core";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { DbService } from "../db.service";

@Component({
  selector: "app-songs",
  templateUrl: "./songs.component.html",
  styleUrls: ["./songs.component.css"]
})
export class SongsComponent implements OnInit {
  faTimes = faTimes;
  songs: any[];

  drop(event: CdkDragDrop<string[]>) {
    console.log(event.previousIndex + " -> " + event.currentIndex);
    moveItemInArray(
      this.songs,
      event.previousIndex + 1,
      event.currentIndex + 1
    );
    this.db.updateQueue(this.songs);
  }

  constructor(private db: DbService) {}

  ngOnInit() {
    this.getGuild();
  }
  getGuild() {
    this.db.guildObvservable.subscribe(_ => {
      this.getQueue();
    });
  }
  getQueue() {
    this.db.getQueue().subscribe(doc => {
      if (!doc.payload.data()) {
        this.songs = [];
        return;
      }
      this.songs = doc.payload.data().queue;
    });
  }

  remove(index: number) {
    this.songs.splice(index, 1);
    this.db.updateQueue(this.songs);
  }
}
