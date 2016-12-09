const Twit = require('twit');
const conf = require('rc')('jkap-blockchain', {});
const fs = require('fs');
const argv = require('optimist').argv;

const T = new Twit(conf);

const startTime = Date.now();
const filename = argv.resume || `followers-${startTime}.json`;
let startCursor = -1;
let followers = [];

if (argv.resume) {
  const resumeData = JSON.parse(fs.readFileSync(filename));
  startCursor = resumeData.cursor;
  followers = resumeData.ids;
}

function appendFollowers(cursor = -1) {
  fs.writeFileSync(filename, JSON.stringify({
    ids: followers,
    cursor,
  }), 'utf8');
  console.log(`Followers retrieved: ${followers.length}`)
  T.get('followers/ids', { screen_name: 'jkap415', cursor }, (err, data, resp) => {
    if (data.ids) {
      followers = followers.concat(data.ids);
    }
    if (data.errors) {
      const resetTime = parseInt(resp.headers['x-rate-limit-reset'], 10) * 1000;
      const limitRemaining = resetTime - Date.now();
      console.log(`Rate limit hit, starting again at ${new Date(resetTime)}`);
      setTimeout(() => {
        appendFollowers(cursor);
      }, limitRemaining);
    }
    if (data.next_cursor_str) {
      appendFollowers(data.next_cursor_str);
    }
  });
}

appendFollowers(startCursor);
