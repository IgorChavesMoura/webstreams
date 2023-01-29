import url from 'node:url';
import https from 'node:https';
import { createServer } from 'node:http';



const PORT = 3001;

createServer(async (request, response) => {

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '* '
    };

    if(request.method === 'OPTIONS') {
        response.writeHead(204, headers);
        response.end();
        return;
    }

    
    const reqUrl = url.parse(request.url, true);
    const imageId = parseInt(reqUrl.query.id);

    if(imageId === NaN) {
        response.writeHead(400);
        response.end();
        return;
    }
    

    https.get(`https://www3.animeflv.net/uploads/animes/covers/${imageId}.jpg`, (resp) => {

        if(resp.statusCode === 200) {
            response.writeHead(200, {
                ...headers,
                'Content-Type': 'image/jpeg'
            });        
        } else {
            response.writeHead(400);
            response.end();
            return;
        }

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            response.write(chunk);
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            response.end();
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });


}).listen(PORT).on('listening', _ => console.log(`Running at port ${PORT}`));