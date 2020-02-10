import { Component, OnInit } from "@angular/core";
import { AuthService } from "../auth.service";
import { DbService } from "../db.service";
import {
  faPlus,
  faHome,
  faTimes,
  faSearch,
  faSave
} from "@fortawesome/free-solid-svg-icons";
import { MatSnackBar } from "@angular/material";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"]
})
export class ProfileComponent implements OnInit {
  faSave = faSave;
  faTimes = faTimes;
  faSearch = faSearch;
  faHome = faHome;
  faPlus = faPlus;
  user: any;
  history: any[];
  mostAdded: any[];
  lists: any[];
  queue: any[];
  query: string;
  results: any[];
  listTitle: string;
  newList: any[];
  playlist = false;

  selected: any;
  guilds: any[];

  constructor(
    private auth: AuthService,
    private db: DbService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.getGuilds();
    this.newList = [];
    this.auth.user.subscribe(user => {
      this.user = user;
      console.log(user);
      this.getSongs();
      this.getQueue();
      this.getLists();
    });
  }

  getGuilds() {
    this.guilds = this.auth.guilds;
    this.selected = this.db.guild ? this.db.guild : this.guilds[0];
    console.log(this.selected);
    this.db.selectGuild(this.selected);
  }

  selectGuild() {
    this.db.selectGuild(this.selected);
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
  getSongs() {
    this.db.getUserSongs(this.user.id).subscribe(snapshots => {
      this.history = [];
      this.mostAdded = [];
      snapshots.forEach(snapshot => {
        this.history.push(snapshot.payload.doc.data());
        this.mostAdded.push(Object.assign({}, snapshot.payload.doc.data()));
      });
      this.history = this.history.sort((a, b) => {
        return b.dateAdded.seconds - a.dateAdded.seconds;
      });
      this.mostAdded = this.mostAdded.sort((a, b) => {
        return b.timesAdded - a.timesAdded;
      });
    });
  }

  getLists() {
    this.db.getLists(this.user.id).subscribe(snapshots => {
      this.lists = [];
      for (let snapshot of snapshots) {
        this.lists.push(snapshot.payload.doc.data());
      }
    });
  }

  addListToQueue(list) {
    for (let song of list.songs) {
      this.db.pushSong(this.user.id, song);
      this.queue.push(song);
    }
    this.db.updateQueue(this.queue);
    this.snackBar.open(list.title + " added to queue", "", {
      duration: 4000
    });
  }
  addSongFromList(song) {
    this.queue.push(song);
    this.db.pushSong(this.user.id, song);
    this.db.updateQueue(this.queue);
    this.snackBar.open(song.title + " added to queue", "", {
      duration: 4000
    });
  }
  addSong(song) {
    this.queue.push(song.song);
    this.db.pushSong(this.user.id, song);
    this.db.updateQueue(this.queue);
    this.snackBar.open(song.song.title + " added to queue", "", {
      duration: 4000
    });
  }

  search() {
    this.results = [];
    this.query = this.query.toLowerCase();
    var isPlaylist = this.query.search(/playlist/i);
    if (isPlaylist != -1) {
      this.playlist = true;
      var q = this.query.replace("playlist ", "");
      q = q.replace(" playlist", "");
      q = q.replace("playlist", "");
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
  addToList(index: number) {
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
            this.newList.push(song);
          }
        },
        error => console.log(error)
      );
    } else {
      var song = this.results[index];
      var id = song.id.videoId;
      var url = "https://www.youtube.com/watch?v=" + id;
      var title = song.snippet.title;
      var thumbnail = song.snippet.thumbnails.high.url;
      this.newList.push({
        id: id,
        thumbnail: thumbnail,
        title: title,
        url: url
      });
    }
  }
  saveList() {
    if (!this.listTitle || this.listTitle == "") {
      // Ask for title in toast
      return;
    }
    this.db.saveList(this.user.id, this.listTitle, this.newList);
    this.listTitle = "";
    this.newList = [];
  }

  drop(event: CdkDragDrop<string[]>) {
    console.log(event.previousIndex + " -> " + event.currentIndex);
    moveItemInArray(this.newList, event.previousIndex, event.currentIndex);
  }

  remove(i: number) {
    this.newList.splice(i, 1);
  }

  clear() {
    this.query = "";
    this.results = [];
  }
}
