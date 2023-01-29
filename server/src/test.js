import https from 'node:https';
import { createWriteStream } from 'node:fs';

const writeStream = createWriteStream('img.jpg');

https.get('https://www3.animeflv.net/uploads/animes/covers/1104.jpg', (resp) => {

    console.log(resp.statusCode);

  // A chunk of data has been received.
  resp.on('data', (chunk) => {
    writeStream.write(chunk);
  });

  // The whole response has been received. Print out the result.
  resp.on('end', () => {
    console.log('ended');
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});