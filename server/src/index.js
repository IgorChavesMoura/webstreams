import path from 'node:path';
import url from 'node:url';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { Readable, Transform, Writable } from 'node:stream';
import { WritableStream, TransformStream } from 'node:stream/web';
import { setTimeout } from 'node:timers/promises';
import { parse, transform } from 'csv';

let pipeline;

const PORT = 3000;

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
    
    const reqItemCount = parseInt(url.parse(request.url, true).query.itemCount || '0');

    const abortController = new AbortController();
    
    let csvHeaders;
    let itemCount = 0, rowCount = 0;

    const csvPath = path.resolve("data", "animeflv.csv");
    const csvParser = parse();
    const csvTransform = transform(function(row,cb) {
        let result;
        if (rowCount === 0 ) {
            csvHeaders = row;
        } else if(rowCount < reqItemCount) {
            cb(null, null);
        } else {
            const json = row.map((field, index) => ({ [csvHeaders[index]]: field })).reduce((acc, current) => ({ ...acc, ...current }), {});
            result = JSON.stringify(json)+'\n'; 
        }
        rowCount++; 
        cb(null,result); 
    });
    




    try {
        response.writeHead(200, headers);

        const pipeline = Readable.toWeb(createReadStream(csvPath).pipe(csvParser).pipe(csvTransform))
        .pipeThrough(new TransformStream({
            transform(chunk, controller) {
                const data = JSON.parse(Buffer.from(chunk));
                console.log(data);
                const imageIdregex = /(.*\/((?<id>[0-9]*).jpg))$/gm;
                const match = imageIdregex.exec(data.image);
                const imageId = match.groups.id;
                controller.enqueue(JSON.stringify({
                    title: data.title,
                    description: data.description,
                    urlAnime: data.url_anime,
                    image: imageId
                }).concat('\n'));
            }
        }))
        .pipeTo(new WritableStream({
            async write(chunk) {
                try {
                    await setTimeout(400);
                    itemCount++;

                    response.write(chunk);
                } catch(err) {
                    console.log(err.message);
                    if (!err.message.includes('abort')) throw err;
                }
            },
            close() {
                response.end();
            }
        }), { signal: abortController.signal });

        request.once('close', _ => {
            console.log('Connection was closed!', `Items processed: ${itemCount}`);
            try {
                pipeline.catch(console.log);
                abortController.abort('stopped');
            } catch(err) {
                console.log(err.message);
                if (!err.message.includes('abort')) throw err;
            }
        });

    } catch(err) {
        console.log(err.message);
        if (!err.message.includes('abort')) throw err;
    }



}).listen(PORT).on('listening', _ => console.log(`Running at port ${PORT}`));