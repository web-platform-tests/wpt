/*
 * == Usage ==
 *
 * Supports the test platform used in testing the specification
 * "MPEG-2 TS to HTML5 Mapping Specification."
 *
 * The test media server can reside on any applicable host in the network.
 * The test media server can be a DMS (digital media server), web server, etc.
 * Test scripts source this file and call mediaServerURL() to construct the
 * URI to source the test media file for that test.
 * Edit the return value of mediaServerURL() to return the URL of your media test server.
 *
 *    e.g.  video.src = mediaServerURL() + "UserPrivateStreams.ts";
 *
 */


/*
 * Return URL of media server. 
 */
  function mediaServerURL()
  {
    //return "http://localhost:80/media/";
    return "http://10.36.32.48:80/media/";
  }
