function getnotification() {
  notification = new Notification("New Email Received", {
    body: "Room 101"
  });
  return notification;
}
