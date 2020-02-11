import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { CookieService } from "ngx-cookie-service";
import { Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { auth } from "firebase/app";
import { AngularFireAuth } from "@angular/fire/auth";

import { DbService } from "./db.service";
import { AngularFirestore } from "@angular/fire/firestore";
import { ThrowStmt } from "@angular/compiler";

interface User {
  id: any;
  username: string;
  discriminator: string;
  bot: boolean;
}

@Injectable({
  providedIn: "root"
})
export class AuthService {
  tokenUrl = "https://discordapp.com/api/oauth2/token";
  discordPath = "https://discordapp.com/api/";
  spotifyPath = "https://accounts.spotify.com/api/token";
  googleAccessToken = null;
  authenticated = false;
  guildVerified = false;
  voiceVerified = false;
  guilds = [];
  user: BehaviorSubject<any> = new BehaviorSubject<any>("");
  userId: string;
  accessToken: string;
  spotifyAccessToken: string;
  prevPath: string;

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private router: Router,
    private afAuth: AngularFireAuth,
    private db: AngularFirestore
  ) {}

  googleLogin() {
    // Creates GoogleAuthProvider
    console.log("Attempting to login with Google...");
    const provider = new auth.GoogleAuthProvider().addScope(
      "https://www.googleapis.com/auth/youtube.readonly"
    );
    return this.oAuthLogin(provider);
  }

  getCurrentUser() {
    return this.afAuth.auth.currentUser;
  }

  private oAuthLogin(provider) {
    // Creates signIn popup for provider
    return this.afAuth.auth.signInWithPopup(provider).then(credential => {
      console.log(credential);
      this.googleAccessToken = (credential.credential as any).accessToken;
      this.cookieService.set("google-token", this.googleAccessToken);
      console.log("Signed in!");
    });
  }

  authorizeSpotify(url: string, code: string) {
    console.log("Retrieving Spotify Access Token!");
    var body = new URLSearchParams();
    body.set("client_id", environment.spotifyData.client_id);
    body.set("client_secret", environment.spotifyData.client_secret);
    body.set("grant_type", "authorization_code");
    body.set("code", code);
    body.set("redirect_uri", url);
    body.set("scope", environment.spotifyData.scope);
    var headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .post(this.spotifyPath, body.toString(), { headers: headers })
      .pipe()
      .subscribe(
        response => {
          console.log(response);
          this.authenticated = true;
          this.spotifyAccessToken = response["access_token"];
          this.cookieService.set(
            "spotify-token",
            response["access_token"],
            new Date().getTime() / 1000 + response["expires_in"]
          );
          this.cookieService.set(
            "spotify-refresh-token",
            response["refresh_token"]
          );
          console.log("spotify-refresh-token");
        },
        error => {
          console.log(error);
        }
      );
  }
  refreshSpotifyToken() {
    console.log("Refreshing Spotify Token...");
    var full = window.location.href.split("/");
    var url = full[0] + "//" + full[2] + "/user";
    var body = new URLSearchParams();
    var refreshToken = this.cookieService.get("spotify-refresh-token");
    console.log("Spotify:");
    console.log(refreshToken);
    console.log(url);
    // body.set("client_id", environment.spotifyData.client_id);
    // body.set("client_secret", environment.spotifyData.client_secret);
    body.set("grant_type", "refresh_token");
    body.set("refresh_token", refreshToken);
    var headers = new HttpHeaders({
      Authorization: `Basic ${environment.spotifyData.client_id}:${environment.spotifyData.client_secret}`,
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .post(this.spotifyPath, body.toString(), { headers: headers })
      .pipe()
      .subscribe(
        response => {
          this.authenticated = true;
          console.log(response);
          console.log(response["access_token"]);
          this.accessToken = response["access_token"];
          this.cookieService.set("spotify-token", response["access_token"]);
          this.cookieService.set(
            "spotify-refresh-token",
            response["refresh_token"]
          );
        },
        error => {
          console.log(error);
        }
      );
  }

  authorizeDiscord(url: string, code: string) {
    console.log("Retrieving G Access Token...");
    if (this.cookieService.check("google-token")) {
      this.googleAccessToken = this.cookieService.get("google-token");
    }
    console.log("Retrieving Spotify Access Token...");
    if (this.cookieService.check("spotify-token")) {
      this.spotifyAccessToken = this.cookieService.get("spotify-token");
    }
    console.log("Retrieving Discord Access Token...");
    if (this.cookieService.check("discord-token")) {
      this.accessToken = this.cookieService.get("discord-token");
      this.authenticated = true;
      this.verifyGuild();
      return;
    }
    var body = new URLSearchParams();
    body.set("client_id", environment.discordData.client_id);
    body.set("client_secret", environment.discordData.client_secret);
    body.set("grant_type", "authorization_code");
    body.set("code", code);
    body.set("redirect_uri", url);
    body.set("scope", environment.discordData.scope);

    var headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .post(this.tokenUrl, body.toString(), { headers: headers })
      .pipe()
      .subscribe(
        response => {
          this.authenticated = true;
          this.accessToken = response["access_token"];
          this.cookieService.set(
            "discord-token",
            response["access_token"],
            new Date().getTime() / 1000 + response["expires_in"]
          );
          this.cookieService.set(
            "discord-refresh-token",
            response["refresh_token"]
          );
          this.verifyGuild();
        },
        error => {
          console.log(error);
        }
      );
  }
  refreshToken() {
    var url = window.location.href.split("/")[0] + "/login";
    console.log("Refreshing token...");
    var body = new URLSearchParams();
    var refreshToken = this.cookieService.get("discord-refresh-token");
    console.log(refreshToken);
    body.set("client_id", environment.discordData.client_id);
    body.set("client_secret", environment.discordData.client_secret);
    body.set("grant_type", "refresh_token");
    body.set("code", refreshToken);
    body.set("redirect_uri", url);
    body.set("scope", environment.discordData.scope);
    var headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .post(this.tokenUrl, body.toString(), { headers: headers })
      .pipe()
      .subscribe(
        response => {
          this.authenticated = true;
          console.log(response);
          console.log(response["access_token"]);
          this.accessToken = response["access_token"];
          this.cookieService.set("discord-token", response["access_token"]);
          this.cookieService.set(
            "discord-refresh-token",
            response["refresh_token"]
          );
          this.verifyGuild();
        },
        error => {
          console.log(error);
        }
      );
  }

  getUser() {
    if (!this.authenticated) {
      return;
    }
    var headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .get(this.discordPath + "users/@me", { headers: headers })
      .subscribe(
        response => {
          let user = response as User;
          this.createUser(user);
          this.user.next(user);
          this.userId = user.id;
          this.router.navigate([this.prevPath]);
        },
        error => {
          console.log(error);
        }
      );
  }

  getGuilds(testServer: boolean) {
    if (!this.authenticated) {
      return;
    }
    var headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    });
    var id = testServer
      ? environment.discordData.testGuildId
      : environment.discordData.mainGuildId;
    this.http
      .get(this.discordPath + "guilds/" + id, { headers: headers })
      .subscribe(
        response => {
          console.log(response);
        },
        error => {
          console.log(error);
        }
      );
  }

  verifyGuild() {
    console.log("Retrieving G Access Token...");
    if (this.cookieService.check("google-token")) {
      this.googleAccessToken = this.cookieService.get("google-token");
    }
    console.log("Retrieving Spotify Access Token...");
    if (this.cookieService.check("spotify-token")) {
      this.spotifyAccessToken = this.cookieService.get("spotify-token");
      // this.refreshSpotifyToken();
    }
    console.log("Retrieving Discord Access Token...");
    if (this.cookieService.check("discord-token")) {
      this.accessToken = this.cookieService.get("discord-token");
      this.authenticated = true;
      // this.refreshToken();
    }
    var headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .get(this.discordPath + "users/@me/guilds", { headers: headers })
      .subscribe(
        response => {
          let guilds = response as Array<any>;
          for (let guild of guilds) {
            if (
              guild.id == environment.discordData.testGuildId ||
              guild.id == environment.discordData.mainGuildId
            ) {
              this.cookieService.set("guildVerified", "true");
              this.guildVerified = true;
              console.log("Guild verified");
              this.getUser();
              this.guilds.push(guild);
            }
          }
          if (!this.guildVerified) {
            this.router.navigate(["/login"]);
          }
        },
        error => {
          console.log(error);
        }
      );
  }

  verifyVoice(testServer: boolean) {
    if (!this.authenticated || !this.guildVerified) {
      return;
    }
    var headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    });
    var id = testServer
      ? environment.discordData.testVoiceId
      : environment.discordData.mainVoiceId;
    this.http
      .get(this.discordPath + "channels/" + id, {
        headers: headers
      })
      .subscribe(
        response => {
          console.log(response);
          let users = response["recipients"];
          console.log(users);
        },
        error => {
          console.log(error);
        }
      );
  }
  createUser(user: any) {
    this.db
      .collection("users")
      .doc(user.id)
      .set(user);
  }
}
// TR
// 673878842628112414
// Main
// 523720897593606155
