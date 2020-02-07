import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { catchError } from "rxjs/operators";
import { CookieService } from "ngx-cookie-service";
import { Router } from "@angular/router";
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
  authenticated = false;
  guildVerified = false;
  voiceVerified = false;
  guilds = [];
  userId: string;
  accessToken: string;

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private router: Router
  ) {}

  authorizeDiscord(url: string, code: string) {
    console.log("Retrieving token...");
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
          this.cookieService.set("discord-token", response["access_token"]);
          this.cookieService.set("refresh-token", response["refresh_token"]);
          this.verifyGuild();
        },
        error => {
          console.log(error);
        }
      );
  }
  refreshToken(url: string) {
    console.log("Refreshing token...");
    var body = new URLSearchParams();
    var refreshToken = this.cookieService.get("refresh-token");
    body.set("client_id", environment.discordData.client_id);
    body.set("client_secret", environment.discordData.client_secret);
    body.set("grant_type", "refresh_token");
    body.set("code", refreshToken);
    body.set("redirect_uri", url);
    body.set("scope", environment.discordData.scope);
    var headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "MonikaBot (http://some.url, v0.1)"
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
          this.cookieService.set("refresh-token", response["refresh_token"]);
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
          this.userId = user.id;
          this.router.navigate([""]);
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
    if (this.cookieService.check("discord-token")) {
      this.accessToken = this.cookieService.get("discord-token");
      this.authenticated = true;
    } else {
      return;
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
              this.guildVerified = true;
              console.log("Guild verified");
              this.getUser();
              this.guilds.push(guild);
            }
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
}
// TR
// 673878842628112414
// Main
// 523720897593606155
