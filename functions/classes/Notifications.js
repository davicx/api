//const mysql = require('mysql')

class Notification {
    constructor(notificationTo) {
        this._notificationTo = notificationTo;

    }
    
    //Method A1: Create a Single Notification
    static createNotification(newNotification) {
        console.log("create Notification, yay! it works! " + newNotification.notificationFrom + " " + newNotification.notificationTo);
    
    }

}


module.exports = Notification;

