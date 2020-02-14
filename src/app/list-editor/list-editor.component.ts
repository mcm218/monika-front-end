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
  faCloud,
  faTrash
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
  selector: "app-list-editor",
  templateUrl: "./list-editor.component.html",
  styleUrls: ["./list-editor.component.css"]
})
export class ListEditorComponent implements OnInit {
  faSave = faSave;
  faTimes = faTimes;
  faSearch = faSearch;

  user: any;

  listId: string;
  query: string;
  results: any[];
  listTitle: string;
  newList: any[];
  playlist = false;

  constructor(private auth: AuthService, private db: DbService) {}

  ngOnInit() {
    this.newList = [];
    this.auth.user.subscribe(user => {
      this.user = user;
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
