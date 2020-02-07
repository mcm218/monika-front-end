import { Component, OnInit } from "@angular/core";
import { faPlus, faTimes, faSearch } from "@fortawesome/free-solid-svg-icons";
import { DbService } from "../db.service";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: "app-search",
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.css"]
})
export class SearchComponent implements OnInit {
  faPlus = faPlus;
  faTimes = faTimes;
  faSearch = faSearch;
  playlist = false;
  queue: any[];
  controller: any;
  results: any[];
  query: string;

  constructor(private db: DbService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.results = [];
    this.query = "";
    this.getGuild();
  }

  getGuild() {
    this.db.guildObvservable.subscribe(_ => {
      this.getQueue();
      this.getController();
    });
  }

  search() {
    this.results = [];
    this.query = this.query.toLowerCase();
    var segments = this.query.split(" ");
    if (segments[0] === "playlist") {
      this.playlist = true;
      var q = this.query.split("playlist ")[1];
      this.db.playlistSearch(q).subscribe(snapshots => {
        this.results = [];
        snapshots.forEach(snapshot => {
          this.results.push(snapshot.payload.doc.data());
        });
        if (snapshots.length == 0) {
          this.db.youtubePlaylistSearch(q, 0).subscribe(
            response => {
              response.items.forEach(item => {
                this.results.push(item);
              });
              this.db.cacheSearch(q, response, true);
            },
            error => console.log(error)
          );
        }
      });
    } else {
      this.playlist = false;
      this.db.search(this.query).subscribe(snapshots => {
        this.results = [];
        snapshots.forEach(snapshot => {
          this.results.push(snapshot.payload.doc.data());
        });
        if (snapshots.length == 0) {
          this.db.youtubeSearch(this.query, 0).subscribe(
            response => {
              this.db.cacheSearch(this.query, response, false);
            },
            error => console.log(error)
          );
        }
      });
    }
  }
  addToQueue(index: number) {
    console.log("Adding to queue...");
    if (this.playlist) {
      this.db.youtubePlaylistItems(this.results[index].id.playlistId).subscribe(
        response => {
          let items = (response as any).items;
          for (let item of items) {
            var id = item.snippet.resourceId.videoId;
            var url = "https://www.youtube.com/watch?v=" + id;
            var title = item.snippet.title;
            var thumbnail = item.snippet.thumbnails.high.url;
            var song = {
              id: id,
              url: url,
              title: title,
              thumbnail: thumbnail
            };
            if (this.controller.shuffleMode) {
              //find rand position
              var pos = Math.floor(Math.random() * (this.queue.length - 1)) + 1;
              this.queue.splice(pos, 0, song);
            } else {
              this.queue.push(song);
            }
          }
          this.snackBar.open(
            this.results[index].snippet.title + " added to queue",
            "",
            { duration: 4000 }
          );
          this.db.updateQueue(this.queue);
        },
        error => console.log(error)
      );
    } else {
      var song = this.results[index];
      var id = song.id.videoId;
      var url = "https://www.youtube.com/watch?v=" + id;
      var title = song.snippet.title;
      var thumbnail = song.snippet.thumbnails.high.url;
      if (this.controller.shuffleMode) {
        //find rand position
        var pos = Math.floor(Math.random() * (this.queue.length - 1)) + 1;
        this.queue.splice(pos, 0, {
          id: id,
          thumbnail: thumbnail,
          title: title,
          url: url
        });
      } else {
        this.queue.push({
          id: id,
          thumbnail: thumbnail,
          title: title,
          url: url
        });
      }
      this.snackBar.open(
        this.results[index].snippet.title + " added to queue",
        "",
        { duration: 4000 }
      );
      this.db.updateQueue(this.queue);
    }
  }

  getQueue() {
    this.db.getQueue().subscribe(doc => {
      if (!doc.payload.data()) {
        this.queue = [];
        return;
      }
      this.queue = doc.payload.data().queue;
    });
  }

  getController() {
    this.db.getController().subscribe(doc => {
      this.controller = doc.payload.data();
    });
  }

  clear() {
    this.query = "";
    this.results = [];
  }
}
