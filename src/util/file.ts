import { saveAs } from './save-as'

/**
 * A class of static utility functions for managing client-side
 */
export class File {

  /**
  * Returns the filename portion of a file path.
  */
  static parseName( path:string, trimExtension = true ) : string {
    let start = path.lastIndexOf("/") + 1;
    let end = trimExtension ? path.lastIndexOf(".") : path.length;
    return path.substr(start, end - start);
  }

  /**
  * Returns the current script name.
  */
  static getScriptName( trimExtension = true ) : string {

    // Variables
    let error = new Error();
    let source: any[] | RegExpExecArray;
    let lastStackFrameRegex = new RegExp(/.+\/(.*?):\d+(:\d+)*$/)
    let currentStackFrameRegex = new RegExp(/getScriptName \(.+\/(.*):\d+:\d+\)/);

    // Get the script name
    let name;
    if((source = lastStackFrameRegex.exec(error.stack.trim())) && source[1] != "") {
      name = source[1];
    } else if ((source = currentStackFrameRegex.exec(error.stack.trim()))) {
      name = source[1];
    } else if ( name = File.parseName(error.stack.trim(), trimExtension)) {
      return name;
    } else {
      return error.message;
    }

    // Return name
    if( trimExtension) {
      let position = name.lastIndexOf(".");
      return name.substr(0, position);
    } else {
      return name;
    }
  }

  static createInlineStyledSvg(originalSvg) : SVGSVGElement {
    // Create a deep copy of the original SVG
    const copiedSvg = originalSvg.cloneNode(true);
  
    // Temporarily append the copied SVG to the DOM, hidden from view
    // copiedSvg.style.position = 'absolute';
    // copiedSvg.style.visibility = 'hidden';
    document.body.appendChild(copiedSvg);
  
    // Helper function to copy the computed styles to inline styles if they differ from the parent's styles
    function copyComputedStyles(element, parentElement) {
      const elementStyles = window.getComputedStyle(element);
      const parentStyles = parentElement ? window.getComputedStyle(parentElement) : null;
  
      const styleAttributes = [
        'fill', 'fill-opacity', 'opacity', // 'fill-rule',
        'stroke', 'stroke-width', 'stroke-opacity', // 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 
        'vector-effect'
      ];
  
      styleAttributes.forEach((styleAttr) => {
        const elementStyleValue = elementStyles.getPropertyValue(styleAttr);
        const parentStyleValue = parentStyles ? parentStyles.getPropertyValue(styleAttr) : '';
  
        if (elementStyleValue !== parentStyleValue) {
          element.style.setProperty(styleAttr, elementStyleValue);
        }
      });
    }
  
    // Recursive function to traverse the DOM tree and apply inline styles if they differ from the parent's styles
    function traverseDOMTree(node, parentNode = null) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        copyComputedStyles(node, parentNode);
  
        Array.from(node.children).forEach((child) => {
          traverseDOMTree(child, node);
        });
      }
    }
  
    // Traverse the copied SVG tree and apply inline styles where necessary
    traverseDOMTree(copiedSvg);
  
    // Remove the copied SVG from the DOM
    document.body.removeChild(copiedSvg);
  
    return copiedSvg;
  }
  
  /**
  * Downloads the current drawing as an svg file.
  */
  static download( id:string, filename:String ) {

    let svg = document.getElementById(id);
    const inlineSvg = this.createInlineStyledSvg(document.getElementById(id))
    File.saveSVG( filename, inlineSvg.outerHTML )
  }

  static processRule(rule) {
    let result = "";
    for( let key of rule.styleMap ) {
      console.log(key);
    }
    return result;
  }

  static saveSVG( filename, data:string) {
    let blob = new Blob([data], {type: 'image/svg+xml'});
    saveAs(blob, filename, {});
  }

  /**
  * Returns a promise containing the response object.
  */
  static getURL( url:string ) : Promise<string> {
    // Return a new promise.
    return new Promise(function(resolve, reject) {
      // Do the usual XHR stuff
      var req = new XMLHttpRequest();
      req.open('GET', url);
      req.onload = function() {
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
      req.onerror = function() {
        reject(Error("Network Error"));
      };

      // Make the request
      req.send();
    });
  }

  /**
  * Gets the URL parameters of the current session.
  */
  static getUrlParams( str:string ) : Map<string, string> {
      let hashes = str.slice(str.indexOf('?') + 1).split('&')
      let params = new Map<string, string>();
      for( let h of hashes ) {
        let value = h.split('=');
        params.set(value[0], value[1]);
      }

      return params
  }

  // TODO: this is unfinished
  static setUrlParams( param:string, value:string) {
    let url = new URL( window.location.href );
    let params = new URLSearchParams( url.search.slice(1));
    params.set(param, value);
    alert(url.href);
    // window.location.href = url.href;
    window.open( url.href);
  }

  /**
  * Loads the interactive script at the provided url into the provided HTMLElement.
  */
  static async loadScript( url:string, element:HTMLElement ) {
    const response = await File.getURL(url);
    let div = document.createElement('div');
    div.id = File.parseName(url);
    let script = document.createElement('script');
    script.type = 'module';
    script.src = url;
    element.appendChild(div);
    element.appendChild(script);
    return response;
  }

}
