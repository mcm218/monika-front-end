import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { AuthService } from "../auth.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"]
})
export class LoginComponent implements OnInit {
  faDiscord = faDiscord;
  code: string;
  url: string;
  discordUrl: string;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.url = window.location.href.split("?")[0];
    var formattedUrl = this.url.replace(":", "%3A").replace("/", "%2F");
    console.log(this.url);
    this.discordUrl =
      "https://discordapp.com/api/oauth2/authorize?client_id=" +
      environment.discordData.client_id +
      "&redirect_uri=" +
      formattedUrl +
      "&response_type=code&scope=identify%20guilds";
      
    this.route.queryParams.subscribe(params => {
      this.code = params["code"];
      console.log(this.code);
      if (this.code) {
        this.authService.authorizeDiscord(this.url, this.code);
      }
    });
  }

  ngOnInit() {}
}
