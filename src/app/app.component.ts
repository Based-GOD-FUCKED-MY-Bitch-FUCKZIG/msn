import { Component } from '@angular/core';
import { UserService } from './services/user.service';
import { RequestService } from './services/request.service';
import { DialogService } from 'ng2-bootstrap-modal';
import { FriendRequestModalComponent } from './modals/friend-request/friend-request.modal';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  me: any = {};
  requests: any = [];
  shouldAdd: boolean;
  mailsShown: any = [];
  constructor(private usersService: UserService,
              private requestService: RequestService,
              private dialogService: DialogService) {
    this.me = JSON.parse(localStorage.getItem('msn_user'));
    if (!this.me) {
      return;
    }
    this.usersService.getUser(this.me.details.user.uid).valueChanges().subscribe((result) => {
      console.log(this.mailsShown);
      this.me = result;
      this.requestService.getRequestsForEmail(this.me.email).valueChanges().subscribe( (requests: any) => {
        this.requests = requests;
        this.requests = this.requests.filter((r) => {
          return r.status !== 'accepted' && r.status !== 'rejected';
        });
        this.requests.forEach((r) => {
          if(this.mailsShown.indexOf(r.sender.email) === -1) {
            this.mailsShown.push(r.sender.email);
            this.dialogService.addDialog(FriendRequestModalComponent, {scope: this, currentRequest: r});
          }
        });
      });
    });
  }
}
