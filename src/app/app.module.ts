import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import {
  MatToolbarModule,
  MatCardModule,
  MatButtonModule,
  MatListModule,
  MatSliderModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatSnackBarModule,
  MatExpansionModule,
  MatTooltipModule,
  MatDialogModule
} from "@angular/material";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { HttpClientModule } from "@angular/common/http";
import { CookieService } from "ngx-cookie-service";
import { MusicPlayerComponent } from "./music-player/music-player.component";
import { SongsComponent } from "./songs/songs.component";
import { HomeComponent } from "./home/home.component";
import { SearchComponent } from "./search/search.component";
import { environment } from "src/environments/environment";
import { LoginComponent } from "./login/login.component";
import { ProfileComponent, DeleteDialog } from "./profile/profile.component";
import { ListEditorComponent } from './list-editor/list-editor.component';
import { ListsComponent } from './lists/lists.component';

@NgModule({
   declarations: [
      AppComponent,
      MusicPlayerComponent,
      SongsComponent,
      HomeComponent,
      SearchComponent,
      LoginComponent,
      ProfileComponent,
      DeleteDialog,
      ListEditorComponent,
      ListsComponent
   ],
   imports: [
      BrowserModule,
      AppRoutingModule,
      FormsModule,
      BrowserAnimationsModule,
      FlexLayoutModule,
      FontAwesomeModule,
      MatToolbarModule,
      MatCardModule,
      MatButtonModule,
      MatSliderModule,
      MatListModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatExpansionModule,
      MatSnackBarModule,
      MatTooltipModule,
      MatDialogModule,
      DragDropModule,
      AngularFireModule.initializeApp(environment.firebaseConfig),
      AngularFirestoreModule,
      AngularFireAuthModule,
      HttpClientModule
   ],
   exports: [
      DeleteDialog
   ],
   entryComponents: [
      DeleteDialog
   ],
   providers: [
      CookieService
   ],
   bootstrap: [
      AppComponent
   ]
})
export class AppModule {}
