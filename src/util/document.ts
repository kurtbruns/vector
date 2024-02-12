/**
* Returns the filename portion of a file path.
*/
function parseName(path: string, trimExtension = true): string {
    let start = path.lastIndexOf("/") + 1;
    let end = trimExtension ? path.lastIndexOf(".") : path.length;
    return path.substr(start, end - start);
}

/**
* Returns the current script name.
*/
function getScriptName(trimExtension = true): string {

    // Variables
    let error = new Error();
    let source: any[] | RegExpExecArray;
    let lastStackFrameRegex = new RegExp(/.+\/(.*?):\d+(:\d+)*$/)
    let currentStackFrameRegex = new RegExp(/getScriptName \(.+\/(.*):\d+:\d+\)/);

    // Get the script name
    let name;
    if ((source = lastStackFrameRegex.exec(error.stack.trim())) && source[1] != "") {
        name = source[1];
    } else if ((source = currentStackFrameRegex.exec(error.stack.trim()))) {
        name = source[1];
    } else if (name = parseName(error.stack.trim(), trimExtension)) {
        return name;
    } else {
        return error.message;
    }

    // Return name
    if (trimExtension) {
        let position = name.lastIndexOf(".");
        return name.substr(0, position);
    } else {
        return name;
    }
}

/**
* Returns a promise containing the response object.
*/
function getURL(url: string): Promise<string> {
    // Return a new promise.
    return new Promise(function (resolve, reject) {
        // Do the usual XHR stuff
        var req = new XMLHttpRequest();
        req.open('GET', url);
        req.onload = function () {
            // This is called even on 404 etc so check the status
            if (req.status == 200) {
                // Resolve the promise with the response text
                resolve(req.response);
            }
            else {
                // Otherwise reject with the status text
                // which will hopefully be a meaningful error
                reject(Error(req.statusText));
            }
        };

        // Handle network errors
        req.onerror = function () {
            reject(Error("Network Error"));
        };

        // Make the request
        req.send();
    });
}

/**
* Gets the URL parameters of the current session.
*/
function getUrlParams(str: string): Map<string, string> {
    let hashes = str.slice(str.indexOf('?') + 1).split('&')
    let params = new Map<string, string>();
    for (let h of hashes) {
        let value = h.split('=');
        params.set(value[0], value[1]);
    }

    return params
}

// TODO: this is unfinished
function setUrlParams(param: string, value: string) {
    let url = new URL(window.location.href);
    let params = new URLSearchParams(url.search.slice(1));
    params.set(param, value);
    alert(url.href);
    // window.location.href = url.href;
    window.open(url.href);
}

/**
* Loads the interactive script at the provided url into the provided HTMLElement.
*/
async function loadScript(url: string, element: HTMLElement) {
    const response = await getURL(url);
    let div = document.createElement('div');
    div.id = parseName(url);
    let script = document.createElement('script');
    script.type = 'module';
    script.src = url;
    element.appendChild(div);
    element.appendChild(script);
    return response;
}