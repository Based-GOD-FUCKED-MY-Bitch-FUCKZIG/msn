import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../services/user.service';
import { ConversationService } from '../services/conversation.service';
import { MessagingService } from '../services/messaging.service';
import { AngularFireStorage } from 'angularfire2/storage';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.css']
})
export class ConversationComponent implements OnInit {
  friend: any = {};
  form: any = {message: ''};
  friendId: any = null;
  me: any = {};
  conversation: any = [];
  ids: any = [];
  shake = false;
  picture: any;
  friendPicture: any;
  uploadedPicture: any;
  currentPictureId: any;
  my_picture: any;
  pictureUpload: any;
  constructor(private activatedRoute: ActivatedRoute, private userService: UserService,
              private messagingService: MessagingService, private fbStorage: AngularFireStorage,
              private conversationService: ConversationService) {
    this.me = JSON.parse(localStorage.getItem('msn_user'));
    this.my_picture = (this.me.downloaded_picture) ? this.me.profile_picture
      : 'https://wir.skyrock.net/wir/v1/profilcrop/?c=mog&w=301&h=301&im=%2Fart%2FPRIP.85914100.3.0.png';
    this.picture = (this.me.downloaded_picture) ? this.me.profile_picture
      : 'https://wir.skyrock.net/wir/v1/profilcrop/?c=mog&w=301&h=301&im=%2Fart%2FPRIP.85914100.3.0.png';
    this.friendId = this.activatedRoute.snapshot.params['uid'];
    this.ids = [this.me.uid, this.friendId].sort();
    this.userService.getUser(this.friendId).valueChanges().subscribe((user) => {
      this.friend = user;
      this.friendPicture = (this.friend.downloaded_picture) ? this.friend.profile_picture
        : 'https://wir.skyrock.net/wir/v1/profilcrop/?c=mog&w=301&h=301&im=%2Fart%2FPRIP.85914100.3.0.png';
      this.conversationService.getConversation(this.ids.join('||')).valueChanges()
        .subscribe((result) => {
          if (!result) {
            return;
          }
          this.conversation = Object.keys(result).map(function (key) { return result[key]; });
          this.conversation.forEach((m: any) => {
            if (!m.seen && m.sender !== this.me.uid) {
              m.seen = true;
              if (m.type === 'zumbido') {
                this.doZumbido();
              } else if (m.type === 'text') {
                const audio = new Audio('assets/sound/new_message.m4a');
                audio.play();
              }
              this.conversationService.updateMessage(this.ids.join('||'), m);
            }
          });
          this.scrollToBottom();
        });
    });
  }
  getUserNickById(id) {
    if (id === this.friendId) {
      return this.friend.nick;
    } else if (id === this.me.uid) {
      return this.me.nick;
    }
  }
  scrollToBottom() {
    window.setTimeout(() => {
      const objDiv = document.getElementById('messageArea');
      if(objDiv) {
        objDiv.scrollTop = objDiv.scrollHeight;
        window.setTimeout(() => {
          objDiv.scrollTop = objDiv.scrollHeight;
        }, 900);
      }
    }, 1);
  }
  ngOnInit() {
  }
  doZumbido() {
    const audio = new Audio('assets/sound/zumbido.m4a');
    audio.play();
    this.shake = true;
    window.setTimeout(() => {
      this.shake = false;
    }, 800);
  }
  sendZumbido() {
    this.doZumbido();
    const messageObject: any = {
      uid: this.ids.join('||'),
      timestamp: Date.now(),
      sender: this.me.uid,
      receiver: this.friendId,
      type: 'zumbido',
    };
    this.conversationService.createConversation(messageObject);
  }
  sendMessage() {
    const messageObject: any = {
      uid: this.ids.join('||'),
      timestamp: Date.now(),
      sender: this.me.uid,
      receiver: this.friendId,
      type: 'text',
      content: this.form.message.replace(/\n$/, '')
    };
    this.conversationService.createConversation(messageObject).then(() => {
      const notificationMessage = {
        type: 'text',
        friend_uid: this.me.uid,
        friend_name: this.me.nick,
        picture: this.picture,
        message: messageObject.content,
        timestamp: Date.now() + ''
      };
      this.messagingService.sendMessage(this.friendId, notificationMessage);
    });
    this.form.message = '';
  }
  changeListener($event): void {
    this.readThis($event.target);
  }
  readThis(inputValue: any) {
    const file: File = inputValue.files[0];
    const myReader: FileReader = new FileReader();

    myReader.onloadend = (e) => {
      this.uploadedPicture = myReader.result;
    };
    myReader.readAsDataURL(file);
  }
  uploadPicture() {
    this.currentPictureId = Date.now();
    const pictures = this.fbStorage.ref('pictures/' + this.currentPictureId + '.jpg').putString(this.uploadedPicture, 'data_url');
    pictures.then((result) => {
      this.uploadedPicture = null;
      this.pictureUpload = this.fbStorage.ref('pictures/' + this.currentPictureId + '.jpg').getDownloadURL();
      this.pictureUpload.subscribe((p) => {
        const messageObject: any = {
          uid: this.ids.join('||'),
          timestamp: Date.now(),
          sender: this.me.uid,
          receiver: this.friendId,
          type: 'picture',
          content: p
        };
        this.conversationService.createConversation(messageObject).then(() => {
          const notificationMessage = {
            type: 'picture',
            friend_uid: this.me.uid,
            friend_name: this.me.nick,
            picture: this.my_picture,
            message: messageObject.content,
            timestamp: Date.now() + ''
          };
          this.messagingService.sendMessage(this.friendId, notificationMessage);
        });
      });
    });
  }
}
