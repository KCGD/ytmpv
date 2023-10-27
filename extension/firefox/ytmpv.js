if (window.location.hostname === "www.youtube.com" && window.location.pathname.includes("/watch")) {
    try {
        console.log(`[YTMPV]: post ${window.location.href}`);
        postToServer(window.location.href, "http://localhost:7999");
    } catch (e) {
        console.error(`[YTMPV]: Failed to post to service. Is the daemon running?`);
        console.error(e);
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
            throw new Error('Network response was not ok');
        }
        return response.text(); // You can also use response.json() if the server responds with JSON
    })
    .then(responseData => {
        console.log('Server response:', responseData);
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}  
