import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from "@angular/router";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: "root"
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    this.authService.prevPath = this.router.url
      .replace("%3F", "?")
      .replace("%3D", "=");
    var index = this.router.url.search(/login/i);
    if (index != -1) {
      this.authService.prevPath = this.router.url.slice(0, index);
    }
    console.log(this.authService.prevPath + ": checking if verified...");
    if (this.authService.guildVerified) {
      return true;
    } else {
      this.authService.verifyGuild();
      return false;
    }
  }
}
