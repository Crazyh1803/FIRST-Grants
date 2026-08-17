#!/usr/bin/env node
/* Inlines index.html + assets into a single self-contained file.
   Used to publish a shareable copy; the multi-file version in this repo
   remains the source of truth.

   Usage:
     node build-standalone.js [outfile]              full standalone document
     node build-standalone.js [outfile] --fragment   body content only, for
       publishers that supply their own <!doctype>/<html>/<head>/<body> wrapper
*/

const fs = require("fs");
const path = require("path");

const root = __dirname;
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const fragment = process.argv.includes("--fragment");
const out = args[0] || path.join(root, "standalone.html");

const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

let html = read("index.html");

html = html.replace(
  /<link rel="stylesheet" href="assets\/styles\.css">/,
  "<style>\n" + read("assets/styles.css") + "\n</style>"
);

html = html.replace(
  /<script src="assets\/grants\.js"><\/script>\s*<script src="assets\/app\.js"><\/script>/,
  "<script>\n" + read("assets/grants.js") + "\n" + read("assets/app.js") + "\n</script>"
);

if (/href="assets\/|src="assets\//.test(html)) {
  console.error("error: an asset reference was not inlined");
  process.exit(1);
}

if (fragment) {
  /* Keep <title> and the inlined <style>, drop the document wrapper. */
  const title = (html.match(/<title>[\s\S]*?<\/title>/) || [""])[0];
  const style = (html.match(/<style>[\s\S]*?<\/style>/) || [""])[0];
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [, ""])[1];
  html = title + "\n" + style + "\n" + body.trim() + "\n";

  /* Anchored on a delimiter so <header> is not mistaken for <head>. */
  if (/<!DOCTYPE[\s>]|<\/?(html|head|body)[\s>]/i.test(html)) {
    console.error("error: wrapper tags survived the fragment transform");
    process.exit(1);
  }
}

fs.writeFileSync(out, html);
console.log("wrote " + out + " (" + (fs.statSync(out).size / 1024).toFixed(1) + " KB)");
