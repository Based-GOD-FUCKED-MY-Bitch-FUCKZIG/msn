const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
exports.fcmSend = functions.database
  .ref('/messages/{userId}/{messageId}')
  .onCreate(event => {
  const message = event.data.val();
    const userId = event.params.userId;
    var tokens = [];
    console.log('******', userId);
    const payload = {
      notification: {
        title: message.friend_name + ' dice: ',
        body: message.message,
        icon: message.picture,
        type: message.type,
        friend_uid: message.friend_uid,
        friend_name: message.friend_name,
        timestamp: message.timestamp
      }
    };
    admin.database().ref('fcmTokens')
      .orderByChild('userId')
      .equalTo(userId)
      .once('value')
      .then( (result) => {
        var obj = result.val();
        var objectsArray = Object.keys(obj).map(key => obj[key]);
        objectsArray.forEach((r) => {
          tokens.push(r.token);
        });
        return admin.messaging().sendToDevice(tokens, payload);
      })
    .then(res => {
      console.log('Sent Successfully', payload);
      return res;
    })
    .catch(err => {
      console.log(err);
    });
});
