import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth} from 'angularfire2/auth';
import * as firebase from 'firebase';
import { BehaviorSubject } from 'rxjs/index';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  messaging = firebase.messaging();
  currentMessage = new BehaviorSubject(null);
  constructor(private db: AngularFireDatabase, private afAuth: AngularFireAuth) { }

  private updateToken(token) {
    this.afAuth.authState.subscribe( (user) => {
      const newDevice = {
        userId: user.uid,
        token: token
      };
      this.db.object('fcmTokens/' + token + '/').set(newDevice);
    });
  }

  getPermission() {
    this.messaging.requestPermission().then( () => {
      console.log('Notification permission granted.');
      return this.messaging.getToken();
    })
      .then(token => {
        console.log(token);
        this.updateToken(token);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  receiveMessage() {
    this.messaging.onMessage((payload) => {
      console.log('Message received. ', payload);
      this.currentMessage.next(payload);
    });
  }
  sendMessage(uid, message) {
    return this.db.object('messages/' + uid + '/' + message.timestamp).set(message);
  }
}
