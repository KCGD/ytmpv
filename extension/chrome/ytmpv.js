let hideLoop = null;

window.addEventListener('onload', () => {
    console.log(`[YTMPV]: Caught onload`);
    PostToDaemon();
    if(hideLoop) {
        clearInterval(hideLoop);
    }
    hideLoop = PlayerHideLoop(1000);
});
window.addEventListener('yt-navigate-finish', () => {
    console.log(`[YTMPV]: Caught navigation change`);
    PostToDaemon();
    if(hideLoop) {
        clearInterval(hideLoop);
    }
    hideLoop = PlayerHideLoop(1000);
});


//post current link to daemon (plays video)
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


//returns interval for hiding and pausing player (interval required because youtube tries to reinstate it)
function PlayerHideLoop(timeout) {
    return setInterval(function(){
        document.getElementById("player").style.display = "none";
        document.querySelectorAll('video')[0].pause();
    }, timeout);
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

/* chrome needs it's own post method (manifest V3): https://stackoverflow.com/questions/3274144/can-i-modify-outgoing-request-headers-with-a-chrome-extension
fetch("http://localhost:7999", {
    method: 'POST',
    mode: 'no-cors',
    cache: 'no-cache',
    'url': "https://www.youtube.com/watch?v=n0fd2MEC2rE",
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'url': "https://www.youtube.com/watch?v=n0fd2MEC2rE",
    },
    body: ""
}).then(function(response) {
    // check the response object for result
    // ...
});
*/
