import { Component, OnInit } from "@angular/core";
import { AuthService } from "../auth.service";
import { DbService } from "../db.service";
import {
  faUser,
  faPhoneSlash,
  faMicrophoneSlash
} from "@fortawesome/free-solid-svg-icons";
import { Subscription } from "rxjs";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"]
})
export class HomeComponent implements OnInit {
  faUser = faUser;
  faPhoneSlash = faPhoneSlash;
  faMicrophoneSlash = faMicrophoneSlash;
  guilds: any[];
  selected: any;
  user: any;
  users: any[];
  constructor(private auth: AuthService, private db: DbService) {}

  ngOnInit() {
    this.getGuilds();
    this.auth.user.subscribe(user => {
      this.user = user;
    });
  }

  getGuilds() {
    this.guilds = this.auth.guilds;
    this.selected = this.db.guild ? this.db.guild : this.guilds[0];
    this.db.selectGuild(this.selected);
    this.usersSubscription = this.db.getUsers().subscribe(snapshots => {
      this.users = [];
      snapshots.forEach(snapshot => {
        var data = snapshot.payload.doc.data() as any;
        if (data.username) {
          this.users.push(data);
        }
      });
    });
  }
  selectGuild() {
    this.db.selectGuild(this.selected);
    this.usersSubscription.unsubscribe();
    this.usersSubscription = this.db.getUsers().subscribe(snapshots => {
      this.users = [];
      snapshots.forEach(snapshot => {
        var data = snapshot.payload.doc.data() as any;
        if (data.username) {
          this.users.push(data);
        }
      });
    });
  }

  usersSubscription: Subscription;
}
