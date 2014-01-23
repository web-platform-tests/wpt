function getnotification() {
  notification = typeof Notification != "undefined" ? new Notification("New Email Received", {
      body: "Room 101"
    })
    : window.webkitNotifications.createNotification("New Email Received", {
      body: "Room 101"
    });
  return notification;
}
