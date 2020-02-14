import { Component, OnInit } from "@angular/core";
import { faPlus, faTimes, faSearch } from "@fortawesome/free-solid-svg-icons";
import { DbService } from "../db.service";
import { MatSnackBar } from "@angular/material";
import { AuthService } from "../auth.service";
import { environment } from "src/environments/environment";
import { ActivatedRoute } from "@angular/router";

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
  uid: string;
  queue: any[];
  controller: any;
  results: any[];
  query: string;

  constructor(
    private db: DbService,
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.results = [];
    this.query = "";
    this.getGuild();
  }

  getGuild() {
    this.db.guildObvservable.subscribe(_ => {
      this.getQueue();
      this.getController();
      this.uid = this.auth.userId;
    });
  }

  search() {
    this.results = [];
    this.query = this.query.toLowerCase();
    if (!this.query || this.query === "") {
      return;
    }
    var forceYoutube = this.query.search(/youtube/i);
    if (this.auth.spotifyAccessToken && forceYoutube == -1) {
      this.db.spotifySongSearch(this.query).subscribe(
        response => {
          var tracks = response.tracks.items;
          tracks.forEach(track => {
            // console.log(track.artists[0].name + " - " + track.name);
            console.log(track);
            this.results.push({ type: "spotify", track });
          });
        },
        error => console.log(error)
      );
      return;
    }
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
        console.log(snapshots.docs);
        snapshots.docs.forEach(snapshot => {
          this.results.push(snapshot.data());
        });
        if (snapshots.docs.length == 0) {
          this.db.youtubeSearch(this.query, 0).subscribe(
            response => {
              response.items.forEach(video => {
                this.results.push(video);
              });
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
    if (this.results[index].type === "spotify") {
      var song = this.results[index];
      // Search for song on youtube to get video URL
      // Use Spotify Album art for thumbnail - result.track.album.images[0].url
      // Title = Name - result.track.name
      // Include Artist = result.artists[0].name
      var query = song.track.artists[0].name + " " + song.track.name;
      this.db.search("spotify " + query).subscribe(snapshots => {
        console.log(snapshots.docs);
        if (snapshots.docs.length == 0) {
          this.db.youtubeSearch(query, 0).subscribe(
            response => {
              this.db.cacheSearch("spotify " + query, response, false);
              //push first result to queue
              // response.items[0] => song to add
              console.log(response);
              var id = response.items[0].id.videoId;
              var thumbnail = song.track.album.images[0].url;
              var title = song.track.name;
              var artist = song.track.artists[0].name;
              var url = "https://www.youtube.com/watch?v=" + id;
              var user = this.auth.user.value;
              this.db.pushSong(this.uid, {
                id: id,
                thumbnail: thumbnail,
                title: title,
                artist: artist,
                url: url
              });
              if (this.controller.shuffleMode) {
                //find rand position
                var pos =
                  Math.floor(Math.random() * (this.queue.length - 1)) + 1;
                this.queue.splice(pos, 0, {
                  user: user,
                  id: id,
                  thumbnail: thumbnail,
                  artist: artist,
                  title: title,
                  url: url
                });
              } else {
                this.queue.push({
                  user: user,
                  id: id,
                  thumbnail: thumbnail,
                  artist: artist,
                  title: title,
                  url: url
                });
              }
              this.snackBar.open(title + " added to queue", "", {
                duration: 4000
              });
              this.db.updateQueue(this.queue);
            },
            error => console.log(error)
          );
        } else {
          //push first result to queue
          var id = snapshots.docs[0].data().id.videoId;
          var thumbnail = song.track.album.images[0].url;
          var title = song.track.name;
          var artist = song.track.artists[0].name;
          var url = "https://www.youtube.com/watch?v=" + id;
          var user = this.auth.user.value;
          this.db.pushSong(this.uid, {
            id: id,
            thumbnail: thumbnail,
            title: title,
            artist: artist,
            url: url
          });
          if (this.controller.shuffleMode) {
            //find rand position
            var pos = Math.floor(Math.random() * (this.queue.length - 1)) + 1;
            this.queue.splice(pos, 0, {
              user: user,
              id: id,
              thumbnail: thumbnail,
              artist: artist,
              title: title,
              url: url
            });
          } else {
            this.queue.push({
              user: user,
              id: id,
              thumbnail: thumbnail,
              artist: artist,
              title: title,
              url: url
            });
          }
          this.snackBar.open(title + " added to queue", "", { duration: 4000 });
          this.db.updateQueue(this.queue);
        }
      });
    } else if (this.playlist) {
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
              user: this.auth.user.value,
              id: id,
              url: url,
              title: title,
              thumbnail: thumbnail
            };
            this.db.pushSong(this.uid, song);
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
      this.db.pushSong(this.uid, {
        id: id,
        thumbnail: thumbnail,
        title: title,
        url: url
      });
      if (this.controller.shuffleMode) {
        //find rand position
        var pos = Math.floor(Math.random() * (this.queue.length - 1)) + 1;
        this.queue.splice(pos, 0, {
          user: this.auth.user.value,
          id: id,
          thumbnail: thumbnail,
          title: title,
          url: url
        });
      } else {
        this.queue.push({
          user: this.auth.user.value,
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
