import { Component, OnInit, Inject } from "@angular/core";
import { AuthService } from "../auth.service";
import { DbService } from "../db.service";
import { faHome } from "@fortawesome/free-solid-svg-icons";
import { faGoogle, faSpotify } from "@fortawesome/free-brands-svg-icons";
import { environment } from "src/environments/environment";
import { ActivatedRoute, Router } from "@angular/router";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from "@angular/material/dialog";

export interface DialogData {
  selectedList: { title: string; songs: any[] };
}

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"]
})
export class ProfileComponent implements OnInit {
  faGoogle = faGoogle;
  faSpotify = faSpotify;
  faHome = faHome;

  spotifyPath = "https://accounts.spotify.com/authorize";
  spotifyUrl;
  url: string;
  code: string;

  user: any;
  selected: any;
  guilds: any[];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private db: DbService,
    public dialog: MatDialog
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
    this.getGuilds();
    this.auth.user.subscribe(user => {
      this.user = user;
    });
    if (!this.db.guild) {
      this.router.navigate([""]);
      return;
    }
  }

  googleSignIn() {
    this.auth.googleLogin().then(() => {
      console.debug(this.auth.getCurrentUser());
    });
  }
  getGuilds() {
    this.guilds = this.auth.guilds;
    this.selected = this.db.guild ? this.db.guild : this.guilds[0];
    this.db.selectGuild(this.selected);
  }

  selectGuild() {
    this.db.selectGuild(this.selected);
  }
}

@Component({
  selector: "delete-dialog",
  templateUrl: "delete-dialog.html"
})
export class DeleteDialog {
  constructor(
    public dialogRef: MatDialogRef<DeleteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
