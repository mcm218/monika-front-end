import { Component, OnInit } from "@angular/core";
import { AuthService } from "../auth.service";
import { DbService } from "../db.service";
import {
  faPlus,
  faHome,
  faTimes,
  faSearch,
  faSave,
  faPen,
  faCloud
} from "@fortawesome/free-solid-svg-icons";
import {
  faGoogle,
  faSpotify,
  faYoutube
} from "@fortawesome/free-brands-svg-icons";
import { MatSnackBar } from "@angular/material";
import {
  CdkDragDrop,
  moveItemInArray,
  CdkDragEnter
} from "@angular/cdk/drag-drop";
import { environment } from "src/environments/environment";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"]
})
export class ProfileComponent implements OnInit {
  faCloud = faCloud;
  faGoogle = faGoogle;
  faYoutube = faYoutube;
  faSpotify = faSpotify;
  faSave = faSave;
  faTimes = faTimes;
  faSearch = faSearch;
  faHome = faHome;
  faPlus = faPlus;
  faPen = faPen;

  spotifyPath = "https://accounts.spotify.com/authorize";
  spotifyUrl;
  url: string;
  code: string;

  user: any;
  history: any[];
  mostAdded: any[];
  lists: any[];
  queue: any[];
  selectedList: any;

  listId: string;
  query: string;
  results: any[];
  listTitle: string;
  newList: any[];
  playlist = false;

  selected: any;
  guilds: any[];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private db: DbService,
    private snackBar: MatSnackBar
  ) {
    this.url = window.location.href.split("?")[0];
    var formattedUrl = this.url.replace(":", "%3A").replace("/", "%2F");
    // add state
    var requestpath = (this.spotifyPath +=
      "?client_id=" + environment.spotifyData.client_id);
    requestpath += "&response_type=code";
    requestpath += "&redirect_uri=" + this.url;
    requestpath += "&scope=" + environment.spotifyData.scope;
    this.spotifyUrl = requestpath;

    this.route.queryParams.subscribe(params => {
      this.code = params["code"];
      if (this.code) {
        this.auth.authorizeSpotify(this.url, this.code);
      }
    });
    if (!this.db.guild) {
      this.router.navigate([""]);
      return;
    }
  }

  ngOnInit() {
    if (!this.db.guild) {
      return;
    }
    this.getGuilds();
    this.newList = [];
    this.auth.user.subscribe(user => {
      this.user = user;
      this.getSongs();
      this.getQueue();
      this.getLists();
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
        snapshots.docs.forEach(snapshot => {
          this.results.push(snapshot.data());
        });
        if (snapshots.docs.length == 0) {
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
    if (this.listId) {
      this.db.saveList(this.user.id, this.listTitle, this.newList, this.listId);
    } else {
      this.db.saveList(this.user.id, this.listTitle, this.newList);
    }
    this.selectedList = null;
    this.listTitle = "";
    this.newList = [];
  }

  editList(list) {
    this.listId = list.id;
    this.listTitle = list.title;
    this.newList = new Array(...list.songs);
  }

  drop(event: CdkDragEnter) {
    moveItemInArray(this.newList, event.item.data, event.container.data);
  }

  remove(i: number) {
    this.newList.splice(i, 1);
  }

  clearList() {
    this.newList = [];
  }
  clear() {
    this.query = "";
    this.results = [];
  }
}
