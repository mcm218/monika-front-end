import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { AuthService } from "../auth.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"]
})
export class LoginComponent implements OnInit {
  code: string;
  url: string;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.url = window.location.href.split("?")[0];
    console.log(this.url);
    this.route.queryParams.subscribe(params => {
      this.code = params["code"];
      console.log(this.code)
      if (this.code) {
        this.authService.authorizeDiscord(this.url, this.code);
      }
    });
  }

  ngOnInit() {}
}
