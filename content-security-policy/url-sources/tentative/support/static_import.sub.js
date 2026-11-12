// Imports the URL string given in the script_url parameter with a static
// import. If it's allowed, the imported script tells the document that it ran.
// Otherwise loading this module fails, which the document notices.
import '{{GET[script_url]}}';
