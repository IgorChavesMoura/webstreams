const API_URL = 'http://localhost:3000';
let itemCount = 1;

async function consumeAPI(signal) {
    const headers = new Headers();
    const response = await fetch(`${API_URL}?itemCount=${itemCount}`, {
        signal,
        headers,
    });

    const reader = response.body
                        .pipeThrough(new TextDecoderStream())
                        .pipeThrough(parseNDJSON());

    return reader;
}

function renderOnDOM(element) {
    return new WritableStream({
        write({ title, description, urlAnime, image }) {

            const articleElement = document.createElement('article');
            articleElement.innerHTML = `
                <div class="text" >
                    <div class="cel">
                        <img src="http://localhost:3001?id=${image}" />
                        <h4>[${itemCount++}] ${title}</h4>
                    </div>
                </div>
            `;

            articleElement.classList.add('slide-in-right');
            element.appendChild(articleElement);
            setTimeout(() => {
                articleElement.classList.remove('slide-in-right');
            }, 200);
        },
        abort(reason) {
            console.log("Aborted! ", reason);
        }
    })
}

function parseNDJSON() {
    let ndJsonBuffer = '';

    return new TransformStream({
        transform(chunk, controller) {
            ndJsonBuffer += chunk;

            const items = ndJsonBuffer.split('\n');
            items.slice(0,-1).forEach(
                item => controller.enqueue(JSON.parse(item))
            );
            
            ndJsonBuffer = items[items.length - 1];
        },
        flush(controller) {
            if(!ndJsonBuffer) return;

            controller.enqueue(JSON.parse(ndJsonBuffer));
        }
    });
}

const [
    start,
    stop,
    cards
] = ['start', 'stop', 'cards'].map(item => document.getElementById(item));

let abortController = new AbortController();

start.addEventListener('click', async () => {
    try {
        const readable = await consumeAPI(abortController.signal);
        readable.pipeTo(renderOnDOM(cards), { signal: abortController.signal }).finally(() => {
            stop.classList.add('disabled');
            start.classList.remove('disabled')
        });
        start.classList.add('disabled');
        stop.classList.remove('disabled');
    } catch (err) {
        console.log(err);
        if (!err.message.toLowerCase().includes('abort')) throw err;
    }
}); 

stop.addEventListener('click', () => {

    try {
        abortController.abort('stopped');
        console.log('Aborting...');
        abortController = new AbortController();
        start.classList.remove('disabled');
        stop.classList.add('disabled');
    } catch (err) {
        console.log(err.name);
        if (!err.message.toLowerCase().includes('abort')) throw err;
    }
  
})


