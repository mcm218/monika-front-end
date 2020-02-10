import { Component, OnInit } from "@angular/core";
import { AuthService } from "../auth.service";
import { DbService } from "../db.service";
import { faUser } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"]
})
export class HomeComponent implements OnInit {
  faUser = faUser;
  guilds: any[];
  selected: any;
  user: any;
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
  }
  selectGuild() {
    this.db.selectGuild(this.selected);
  }
}
