import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable, BehaviorSubject, of } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: "root"
})
export class DbService {
  youtubeSearchPath =
    "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&key=" +
    environment.youtubeKey +
    "&q=";
  backupSearchPath =
    "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&key=" +
    environment.backupKey +
    "&q=";
  youtubeVideoPath =
    "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&key=" +
    environment.youtubeKey +
    "&id=";
  backupVideoPath =
    "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&key=" +
    environment.backupKey +
    "&id=";

  playlistPath =
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&key=" +
    environment.youtubeKey +
    "&playlistId=";

  myPlaylistPath =
    "https://www.googleapis.com/youtube/v3/playlists?part=snippet%2CcontentDetails&maxResults=25&mine=true&key=" +
    environment.youtubeKey;
  videoPath = [this.youtubeVideoPath, this.backupVideoPath];
  searchPath = [this.youtubeSearchPath, this.backupSearchPath];
  guildObvservable: BehaviorSubject<any> = new BehaviorSubject<any>("");
  guild: any;

  constructor(
    private db: AngularFirestore,
    private auth: AuthService,
    private http: HttpClient
  ) {}

  validURL(str: string): boolean {
    var pattern = new RegExp(
      "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // fragment locator
    return !!pattern.test(str);
  }

  createUser(user: any) {
    this.db
      .collection("users")
      .doc(user.id)
      .set(user);
  }

  pushSong(id: string, song: any) {
    console.log(id);
    var now = new Date();
    var ref = this.db.collection("users/" + id + "/history").doc(song.id);
    ref.get().subscribe(snapshot => {
      if (!snapshot.data()) {
        ref.set({ song: song, dateAdded: now, timesAdded: 1 });
      } else {
        var num = snapshot.data().timesAdded + 1;
        ref.set({ dateAdded: now, timesAdded: num }, { merge: true });
      }
    });
  }
  getUserSongs(id: string): Observable<any> {
    return this.db.collection("users/" + id + "/history").snapshotChanges();
  }

  saveList(uid: string, title: string, songs: any[], id?: string) {
    if (id) {
      return this.db
        .collection("users/" + uid + "/lists")
        .doc(id)
        .set({
          title: title,
          songs: songs
        });
    }
    var id = this.db.createId();
    return this.db
      .collection("users/" + uid + "/lists")
      .doc(id)
      .set({
        title: title,
        songs: songs
      });
  }
  getLists(uid: string) {
    return this.db.collection("users/" + uid + "/lists").snapshotChanges();
  }
  deleteList(id: string) {
    this.db
      .collection("users/" + this.auth.userId + "/lists")
      .doc(id)
      .delete();
  }
  getYoutubeLists(): Observable<any> {
    var user = this.auth.getCurrentUser;
    if (user) {
      return of(null);
    }
    return this.http.get(this.myPlaylistPath).pipe();
  }

  getSpotifyLists(): Observable<any> {
    var headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.spotifyAccessToken}`
    });
    return this.http.get("https://api.spotify.com/v1/me/playlists?limit=50", {
      headers: headers
    });
  }

  getSpotifyTracks(url: string): Observable<any> {
    var headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.spotifyAccessToken}`
    });
    return this.http.get(url, {
      headers: headers
    });
  }

  selectGuild(guild) {
    this.guild = guild;
    this.guildObvservable.next(guild);
  }

  getQueue(): Observable<any> {
    if (!this.guild) {
      return of(null);
    }
    var path = "guilds/" + this.guild.id + "/VC";
    return this.db
      .collection(path)
      .doc("queue")
      .snapshotChanges();
  }

  updateQueue(queue: any[]) {
    var path = "guilds/" + this.guild.id + "/VC";
    this.db
      .collection(path)
      .doc("queue")
      .set({ queue: queue });
  }

  getThumbnail(id: string, key: number): Observable<any> {
    return this.http.get(this.videoPath[key] + id);
  }

  getController(): Observable<any> {
    var path = "guilds/" + this.guild.id + "/VC";
    return this.db
      .collection(path)
      .doc("controller")
      .snapshotChanges();
  }

  updateController(controller: any) {
    var path = "guilds/" + this.guild.id + "/VC";
    this.db
      .collection(path)
      .doc("controller")
      .set(controller);
  }

  playlistSearch(q: string): Observable<any> {
    q = q.split(" ").join("+");
    console.log(q);
    return this.db.collection("searches/playlists/" + q).snapshotChanges();
  }
  cacheSearch(q: string, response, playlist: boolean) {
    q = q.split(" ").join("+");

    if (playlist) {
      let i = 0;
      response.items.forEach(item => {
        this.db
          .collection("searches/playlists/" + q)
          .doc(i.toString())
          .set(item);
        i++;
      });
    } else {
      let i = 0;
      response.items.forEach(item => {
        this.db
          .collection("searches/videos/" + q)
          .doc(i.toString())
          .set(item);
        i++;
      });
    }
  }

  myYoutubePlaylists() {
    //: Observable<any> {
    var headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.googleAccessToken}`
    });
    return this.http.get(this.myPlaylistPath, { headers: headers }).pipe();
  }

  youtubePlaylistSearch(q: string, key: number): Observable<any> {
    return this.http.get(this.searchPath[key] + q + "&type=playlist").pipe();
  }

  youtubePlaylistItems(id: string) {
    var headers;
    if (this.auth.googleAccessToken) {
      headers = new HttpHeaders({
        Authorization: `Bearer ${this.auth.googleAccessToken}`
      });
    }

    return this.http.get(this.playlistPath + id, { headers: headers }).pipe();
  }

  search(q: string): Observable<any> {
    q = q.split(" ").join("+");
    console.log(q);
    return this.db.collection("searches/videos/" + q).get();
  }

  youtubeSearch(q: string, key: number): Observable<any> {
    return this.http.get(this.searchPath[key] + q + "&type=video").pipe();
  }

  checkFavorite(id: string) {
    return this.db
      .collection("users/" + this.auth.userId + "/favorites")
      .doc(id)
      .get();
  }

  toggleFavorite(id: string, song: any) {
    var ref = this.db
      .collection("users/" + this.auth.userId + "/favorites")
      .doc(id);

    ref.get().subscribe(doc => {
      if (doc.exists) {
        ref.delete();
      } else {
        ref.set({
          id: song.id,
          thumbnail: song.thumbnail,
          title: song.title,
          url: song.url
        });
      }
    });
  }
  getFavorites() {
    return this.db
      .collection("users/" + this.auth.userId + "/favorites")
      .snapshotChanges();
  }

  getUsers() {
    return this.db
      .collection("guilds/" + this.guild.id + "/VC")
      .snapshotChanges();
  }
}
