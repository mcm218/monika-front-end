import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable, BehaviorSubject } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { catchError, tap } from "rxjs/operators";
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

  videoPath = [this.youtubeVideoPath, this.backupVideoPath];
  searchPath = [this.youtubeSearchPath, this.backupSearchPath];
  guildObvservable: BehaviorSubject<any> = new BehaviorSubject<any>("");
  guild: any;

  constructor(private db: AngularFirestore, private http: HttpClient) {}

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

  selectGuild(guild) {
    this.guild = guild;
    this.guildObvservable.next(guild);
  }

  getQueue(): Observable<any> {
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

  youtubePlaylistSearch(q: string, key: number): Observable<any> {
    return this.http.get(this.searchPath[key] + q + "&type=playlist").pipe();
  }

  youtubePlaylistItems(id: string) {
    return this.http.get(this.playlistPath + id).pipe();
  }

  search(q: string): Observable<any> {
    q = q.split(" ").join("+");
    console.log(q);
    return this.db.collection("searches/videos/" + q).snapshotChanges();
  }

  youtubeSearch(q: string, key: number): Observable<any> {
    return this.http.get(this.searchPath[key] + q + "&type=video").pipe();
  }
}
