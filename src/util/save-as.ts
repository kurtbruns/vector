/*
* FileSaver.js
* A saveAs() FileSaver implementation.
*
* By Eli Grey, http://eligrey.com
*
* License : https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md (MIT)
* source  : http://purl.eligrey.com/github/FileSaver.js
*/

function download(url: string, name: string, opts: any): void {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.responseType = 'blob';
  xhr.onload = function () {
    saveAs(xhr.response, name, opts);
  }
  xhr.onerror = function () {
    console.error('could not download file');
  }
  xhr.send();
}

function corsEnabled(url: string): boolean {
  var xhr = new XMLHttpRequest();
  // use sync to avoid popup blocker
  xhr.open('HEAD', url, false);
  xhr.send();
  return xhr.status >= 200 && xhr.status <= 299;
}

function click(node: Element): void {
  try {
    node.dispatchEvent(new MouseEvent('click'));
  } catch (e) {
    var evt = document.createEvent('MouseEvents');
    evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80,
      20, false, false, false, false, 0, null);
    node.dispatchEvent(evt);
  }
}

export function saveAs(blob: string | Blob, name: string, opts: any): void {
  var a = document.createElement('a');
  name = name || (blob instanceof File ? blob.name : 'download');

  a.download = name;
  a.rel = 'noopener'; // tabnabbing

  if (typeof blob === 'string') {
    // Support regular links
    a.href = blob;
    if (a.origin !== location.origin) {
      corsEnabled(a.href) ? download(blob, name, opts) : click(a);
    } else {
      click(a);
    }
  } else {
    // Support blobs
    a.href = URL.createObjectURL(blob);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4E4); // 40s
    setTimeout(function () { click(a); }, 0);
  }
}
