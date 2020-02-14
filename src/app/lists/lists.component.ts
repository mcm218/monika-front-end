import { Component, OnInit } from "@angular/core";
import { AuthService } from "../auth.service";
import { DbService } from "../db.service";
import {
  faPlus,
  faPen,
  faCloud,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { MatSnackBar } from "@angular/material";
import { ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { DeleteDialog } from "../profile/profile.component";

@Component({
  selector: "app-lists",
  templateUrl: "./lists.component.html",
  styleUrls: ["./lists.component.css"]
})
export class ListsComponent implements OnInit {
  faCloud = faCloud;
  faYoutube = faYoutube;
  faSpotify = faSpotify;
  faPlus = faPlus;
  faPen = faPen;
  faTrash = faTrash;

  spotifyPath = "https://accounts.spotify.com/authorize";
  spotifyUrl;
  url: string;
  code: string;

  user: any;
  favorites: any[];
  history: any[];
  mostAdded: any[];
  lists: any[];
  queue: any[];
  selectedList: any;

  selected: any;
  guilds: any[];
  constructor(
    private auth: AuthService,
    private db: DbService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.getGuilds();
    this.auth.user.subscribe(user => {
      this.user = user;
      this.getSongs();
      this.getQueue();
      this.getFavorites();
      this.getLists();
    });
  }

  openDeleteDialog(): void {
    const dialogRef = this.dialog.open(DeleteDialog, {
      width: "250px",
      data: { selectedList: this.selectedList }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(result);
      if (result) {
        this.db.deleteList(this.selectedList.id);
        this.selectedList = [];
      }
    });
  }

  getFavorites() {
    this.db.getFavorites().subscribe(snapshots => {
      this.favorites = [];
      snapshots.forEach(snapshot => {
        this.favorites.push(snapshot.payload.doc.data());
      });
    });
  }
  googleSignIn() {
    this.auth.googleLogin().then(() => {
      if (this.auth.getCurrentUser) {
        this.getYouTubeLists();
      }
    });
  }

  getSpotifyLists() {
    this.db.getSpotifyLists().subscribe(
      response => {
        response.items.forEach(playlist => {
          this.db.getSpotifyTracks(playlist.tracks.href).subscribe(response => {
            var items = (response as any).items;
            var list = [];
            items.forEach(item => {
              var song = {
                title: item.track.artists[0].name + " " + item.track.name,
                type: "spotify"
              };
              list.push(song);
            });
            this.lists.push({
              title: playlist.name,
              type: "spotify",
              songs: list
            });
            this.lists.sort((a, b) => {
              return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1;
            });
          });
        });
      },
      error => console.log(error)
    );
  }
  getYouTubeLists() {
    this.db.myYoutubePlaylists().subscribe(
      response => {
        let items = (response as any).items;
        items.forEach(item => {
          this.db.youtubePlaylistItems(item.id).subscribe(
            response => {
              var list = [];
              let items = (response as any).items;
              for (let item of items) {
                var id = item.snippet.resourceId.videoId;
                var url = "https://www.youtube.com/watch?v=" + id;
                var title = item.snippet.title;
                var thumbnail;
                if (item.snippet.thumbnails) {
                  if (item.snippet.thumbnails.maxres) {
                    thumbnail = item.snippet.thumbnails.maxres.url;
                  } else if (item.snippet.thumbnails.standard) {
                    thumbnail = item.snippet.thumbnails.standard.url;
                  } else {
                    thumbnail = item.snippet.thumbnails.high.url;
                  }
                }
                var song = {
                  id: id,
                  url: url,
                  title: title,
                  thumbnail: thumbnail
                };
                list.push(song);
              }
              this.lists.push({
                title: item.snippet.title,
                type: "youtube",
                songs: list
              });
              this.lists.sort((a, b) => {
                return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1;
              });
            },
            error => console.log(error)
          );
        });
      },
      error => console.log(error)
    );
  }
  getGuilds() {
    this.guilds = this.auth.guilds;
    this.selected = this.db.guild ? this.db.guild : this.guilds[0];
    this.db.selectGuild(this.selected);
  }

  selectGuild() {
    this.db.selectGuild(this.selected);
  }

  getQueue() {
    this.db.getQueue().subscribe(doc => {
      if (!doc || !doc.payload.data()) {
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
        var song = snapshot.payload.doc.data();
        this.history.push({
          ...song.song,
          dateAdded: song.dateAdded,
          timesAdded: song.timesAdded
        });
        this.mostAdded.push(
          Object.assign(
            {},
            {
              ...song.song,
              dateAdded: song.dateAdded,
              timesAdded: song.timesAdded
            }
          )
        );
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
        this.lists.push({
          id: snapshot.payload.doc.id,
          type: "firestore",
          ...(snapshot.payload.doc.data() as Object)
        });
      }
      this.lists.sort((a, b) => {
        return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1;
      });
      if (this.auth.googleAccessToken) {
        this.getYouTubeLists();
      }
      if (this.auth.spotifyAccessToken) {
        this.getSpotifyLists();
      }
    });
  }

  addListToQueue(list) {
    for (let song of list.songs) {
      this.db.pushSong(this.user.id, song);
      this.queue.push({ user: this.auth.user.value, ...song });
    }
    this.db.updateQueue(this.queue);
    this.snackBar.open(list.title + " added to queue", "", {
      duration: 4000
    });
  }
  addSongFromList(song) {
    if (song.type === "spotify") {
      var q = song.title;
      this.db.search(q).subscribe(snapshots => {
        if (snapshots.docs.length == 0) {
          this.db.youtubeSearch(q, 0).subscribe(
            response => {
              this.db.cacheSearch(q, response, false);
              var song = response.items[0];
              var id = song.id.videoId;
              var url = "https://www.youtube.com/watch?v=" + id;
              var title = song.snippet.title;
              var thumbnail;
              if (song.snippet.thumbnails) {
                if (song.snippet.thumbnails.maxres) {
                  thumbnail = song.snippet.thumbnails.maxres.url;
                } else if (song.snippet.thumbnails.standard) {
                  thumbnail = song.snippet.thumbnails.standard.url;
                } else {
                  thumbnail = song.snippet.thumbnails.high.url;
                }
              }
              this.queue.push({
                user: this.auth.user.value,
                id: id,
                thumbnail: thumbnail,
                title: title,
                url: url
              });
              this.db.pushSong(this.user.id, {
                id: id,
                thumbnail: thumbnail,
                title: title,
                url: url
              });
              this.db.updateQueue(this.queue);
              this.snackBar.open(title + " added to queue", "", {
                duration: 4000
              });
            },
            error => console.log(error)
          );
        } else {
          console.log(snapshots);
          var song = snapshots.docs[0].data();
          var id = song.id.videoId;
          var url = "https://www.youtube.com/watch?v=" + id;
          var title = song.snippet.title;
          var thumbnail;
          if (song.snippet.thumbnails) {
            if (song.snippet.thumbnails.maxres) {
              thumbnail = song.snippet.thumbnails.maxres.url;
            } else if (song.snippet.thumbnails.standard) {
              thumbnail = song.snippet.thumbnails.standard.url;
            } else {
              thumbnail = song.snippet.thumbnails.high.url;
            }
          }
          this.queue.push({
            user: this.auth.user.value,
            id: id,
            thumbnail: thumbnail,
            title: title,
            url: url
          });
          this.db.updateQueue(this.queue);
          this.snackBar.open(title + " added to queue", "", {
            duration: 4000
          });
        }
      });
      return;
    }
    this.queue.push({ user: this.auth.user.value, ...song });
    this.db.pushSong(this.user.id, song);
    this.db.updateQueue(this.queue);
    this.snackBar.open(song.title + " added to queue", "", {
      duration: 4000
    });
  }
}
