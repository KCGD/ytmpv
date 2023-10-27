
window.addEventListener('onload', () => {
    console.log(`[YTMPV]: Caught onload`);
    DestroyVideoRecursive(10, 1000);
    PostToDaemon();
});
window.addEventListener('yt-navigate-finish', () => {
    console.log(`[YTMPV]: Caught navigation change`);
    DestroyVideoRecursive(10, 1000);
    PostToDaemon();
});

function PostToDaemon() {
    if (window.location.hostname === "www.youtube.com" && window.location.pathname.includes("/watch")) {
        //post video link to daemon process
        try {
            console.log(`[YTMPV]: post ${window.location.href}`);
            postToServer(window.location.href, "http://localhost:7999");
        } catch (e) {
            console.error(`[YTMPV]: Failed to post to service. Is the daemon running?`);
            console.error(e);
        }
    }
}


//stop video playing
function StopVideo() {
    try {
        console.log(`[YTMPV]: Attempt to stop any playing videos`);
        document.querySelectorAll('video')[0].pause();
    } catch (e) {
        console.log(`[YTMPV]: Failed to get element for video player`);
    }
}


//stop video playing (perminantly)
function DestroyVideo() {
    try {
        console.log(`[YTMPV]: Attempt to destroy the video player`);
        document.getElementById('player').remove();
    } catch (e) {
        console.log(`[YTMPV]: Failed to get element for video player`);
    }
}


//some weird logic causes the video player to reinstate itself. This continuously tries to destroy it until it does not exist.
function DestroyVideoRecursive(attempts, timeout) {
    let player = document.getElementById('player'); //returns null if element not defined
    if(player) {
        console.log(`[YTMPV]: Attempting to destroy player (will try ${attempts-1} more times in ${timeout}ms intervals)`);
        player.remove();

        setTimeout(function() {
            DestroyVideoRecursive(attempts-1, timeout);
        }, timeout);
    } else {
        console.log(`[YTMPV]: Could not find a video player to destroy`);
    }
}


function postToServer(data, url) {
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain', // Set the content type to plain text
            'url': data
        },
        body: data, // The data you want to send as the request body
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('[YTMPV]: Problem contacting daemon');
        }
        return response.text(); // You can also use response.json() if the server responds with JSON
    })
    .then(responseData => {
        console.log('[YTMPV]: daemon response:', responseData);
    })
    .catch(error => {
        console.error('[YTMPV]: There was a problem with the fetch operation:', error);
    });
}  
