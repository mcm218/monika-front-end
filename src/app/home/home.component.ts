import { Component, OnInit } from "@angular/core";
import { AuthService } from "../auth.service";
import { DbService } from "../db.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"]
})
export class HomeComponent implements OnInit {
  guilds: any[];
  selected: any;
  constructor(private auth: AuthService, private db: DbService) {}

  ngOnInit() {
    this.getGuilds();
  }

  getGuilds() {
    this.guilds = this.auth.guilds;
    this.selected = this.guilds[0];
    this.db.selectGuild(this.selected);
  }
  selectGuild() {
    this.db.selectGuild(this.selected);
  }
}
