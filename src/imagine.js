//Author: Diogo Pontual (diogo@paralelo15.com.br)
//Date:  09-11-2014
/**
 * Some utilities methods,
 * @type {Object}
 */
BrowserUtils = {
    browsers: {
        'msie': '',
        'chrome': 'chrome',
        'safari': 'safari',
        'firefox': 'firefox',
        'opera': 'opera',
        'other': 'other'
    },
    /**
     * Returns the name of browser
     * @return string The name of the browser: chrome, firefox...
     */
    getBrowserName: function() {
        var userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf('chrome') > 0) {
            return BrowserUtils.browsers.chrome;
        } else if (userAgent.indexOf('firefox') >= 0) {
            return BrowserUtils.browsers.firefox;
        }
        return BrowserUtils.browsers.other;
    },
    /**
     * Takes an dataURI and returns its  Blob representation
     * @param  string dataURI
     * @return Blob
     */
    dataURItoBlob: function(dataURI) {
        var str = atob(dataURI.split(',')[1]);
        var array = [];
        for (var i = 0; i < str.length; i++) {
            array.push(str.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)]);
    },
    writeText: function(context, text, margin,lineHeight) {
        var width = context.canvas.width;
        var height = context.canvas.height;
        var maxWidth = width - margin;
        var words = text.split(' ');
        var lines = [];
        var line = '';
        var testLine, metrics, testWidth;
        var x;
        for (var n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            if(metrics)
                testWidth = metrics.width;
            metrics = context.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                lines.push({
                    text: line,
                    x: width / 2 - testWidth / 2
                });
                line = words[n] + ' ';
            } else {
                line = testLine;

            }
        }
        if (line.trim().length > 0) {
            metrics = context.measureText(line);
            lines.push({
                text: line,
                x: width / 2 - metrics.width / 2
            });
        }
        var textHeight = lineHeight * lines.length;
        var y = (height / 2) - (textHeight / 2);
        for (var i = 0; i < lines.length; i++) {
            var iLine = lines[i];
            context.fillText(iLine.text, iLine.x, y);
            y += lineHeight;
        }
    }
};
/**
 * Statefull objects that configure and manipulate html canvas elements,
 * to receive (with drop), resize, crop and post images.
 *
 *  To construct an imagine instance one should do: var imgEditor = Imagine(canvasElement);
 */
var Imagine = function() {
    var STATE_IDLE = 0,
        STATE_POSITIONING = 1;
    var origin = {
        x: 0,
        y: 0
    };
    var imagePostionOnDragStart = {},
        cursorPositionOnDragStart = {},
        factor = 1,
        state = STATE_IDLE,
        input = null,
        element = null,
        config = null,
        windowWidth = -1,
        windowHeight = -1,
        scaleX = 1,
        scaleY = 1,
        backgroundColor,
        windowAlpha,
        windowColor,
        outputFormat,
        color,
        font,
        placeholder,
        lineHeight;
    var addClass = function(clazz) {
        if (element.className.indexOf('hover') < 0)
            element.className = element.className + " " + clazz;
    };
    var removeClass = function(clazz) {
        clazz = clazz.trim();
        var classes = element.className.split(" ");
        var nClasses = "";
        for (var i = 0; i < classes.length; i++) {
            if (classes[i].trim() != clazz) {
                nClasses += " " + classes[i];
            }
        }
        element.className = nClasses;
    };
    var draw = function(file) {
        var reader = new FileReader();
        reader.onload = function(loadedFile) {
            input = new Image();
            var context = element.getContext('2d');
            input.src = loadedFile.target.result;
            input.title = file.name;
            context.clearRect(0, 0, element.width, element.height);
            factor = 1;
            origin.x = (element.width / 2) - (input.width / 2);
            origin.y = (element.height / 2) - (input.height / 2);
            context.drawImage(input, origin.x, origin.y, input.width, input.height);
            drawFrame(context, element);
        };
        reader.readAsDataURL(file);
    };
    var redraw = function() {
        if (input !== null) {
            var context = this.getContext('2d');
            var newWidth = input.width * factor;
            var newHeight = input.height * factor;
            var x = origin.x - ((newWidth - input.width) / 2);
            var y = origin.y - ((newHeight - input.height) / 2);
            context.clearRect(0, 0, this.width, this.height);
            context.drawImage(input, x, y, newWidth, newHeight);
            drawFrame(context, this);
        }
    };
    var drawFrame = function(context, canvas) {
        context.globalAlpha = 0.5;
        var rectWidth = parseInt((canvas.width - windowWidth) / 2);
        var rectHeight = parseInt((canvas.height - windowHeight) / 2);
        context.fillRect(0, 0, canvas.width, rectHeight);
        context.fillRect(0, rectHeight, rectWidth, canvas.height - (rectHeight * 2));
        context.fillRect(0, canvas.height - rectHeight, canvas.width, rectHeight);
        context.fillRect(canvas.width - rectWidth, rectHeight, rectWidth, canvas.height - (rectHeight * 2));
        context.globalAlpha = 1;
    };
    var getInputSize = function() {
        if (!input)
            return null;
        return {
            width: input.width,
            height: input.height,
        };
    };
    var getCurrentSize = function() {
        if (!input)
            return null;
        return {
            width: parseInt(input.width * factor),
            height: parseInt(input.height * factor)
        };
    };
    var getOutputSize = function() {
        var r = {};
        r.width = scaleX ? windowWidth * scaleX : windowWidth;
        r.height = scaleY ? windowHeight * scaleY : windowHeight;
        return r;
    };
    var getScale = function() {
        return {
            x: scaleX,
            y: scaleY
        };
    };
    var getWindowSize = function() {
        return {
            width: windowWidth,
            height: windowHeight
        };
    };
    var getCurrentFactor = function() {
        return factor;
    };
    var getCurrentOffset = function() {
        if (!input)
            return;
        var r = {};
        var windowTop = parseInt((element.height - windowHeight) / 2);
        var windowLeft = parseInt((element.width - windowWidth) / 2);
        var inputSize = getInputSize();
        r.x = parseInt(((origin.x - windowLeft) * -1) + ((inputSize.width * factor - inputSize.width) / 2));
        r.y = parseInt(((origin.y - windowTop) * -1) + ((inputSize.height * factor - inputSize.height) / 2));
        return r;
    };
    /*
     *	Read and return results.
     */
    var getOutput = function(quality) {
        //1 - Descobrir qual parte de input está contigo em window;
        //1.1 - Descobrir os cantos que coincidem com window em current;
        //1.2 - Calcular estes cantos em input, dividindo largura e altura por factor;
        //2 - Criar um canvas com tamanho igual à window * scale;
        //3 - Desenhar part no novo canvas
        var currentOffset = getCurrentOffset();
        var windowSize = getWindowSize();
        var currentSize = getCurrentSize();
        var x1 = currentOffset.x < 0 ? 0 : currentOffset.x;
        var y1 = currentOffset.y < 0 ? 0 : currentOffset.y;
        var lx1 = currentOffset.x * -1 + currentSize.width;
        var ly1 = currentOffset.y * -1 + currentSize.height;
        var w1 = lx1 < windowSize.width ? currentSize.width : currentSize.width - (lx1 - windowSize.width);
        var h1 = ly1 < windowSize.height ? currentSize.height : currentSize.height - (ly1 - windowSize.height);
        w1_1 = parseInt(w1 / factor);
        h1_1 = parseInt(h1 / factor);
        var scale = getScale();
        var x2 = currentOffset.x < 0 ? currentOffset.x * -1 : 0;
        var y2 = currentOffset.y < 0 ? currentOffset.y * -1 : 0;
        var w2 = w1 * scale.x;
        var h2 = h1 * scale.y;
        var cw = windowSize.width * scale.x;
        var ch = windowSize.height * scale.y;
        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = cw;
        tmpCanvas.height = ch;
        var tmpContext = tmpCanvas.getContext('2d');
        tmpContext.fillStyle = backgroundColor;
        tmpContext.fillRect(0, 0, cw, ch);
        tmpContext.drawImage(input, x1 / factor, y1 / factor, w1_1, h1_1, x2 * scale.x, y2 * scale.y, w2, h2);
        dataUrl = tmpCanvas.toDataURL('image/' + outputFormat, quality);
        return dataUrl;
    };
    var sendOutput = function(url, quality, callback) {
        if (!quality)
            quality = 1;
        var dataURL = getOutput(quality);
        var blob = BrowserUtils.dataURItoBlob(dataURL);
        var fd = new FormData();
        fd.append("file", blob);
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    callback(null);
                } else {
                    callback(xhr.statusText);
                }
            }
        };
        xhr.open('POST', url, true);
        xhr.send(fd);
    };
    var sendInput = function(url, callback) {
        var fd = new FormData();
        fd.append("file", input);
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    callback(null);
                } else {
                    callback(xhr.statusText);
                }
            }
        };
        xhr.open('POST', url, true);
        xhr.send(fd);
    };

    var writePlaceholder = function() {
        if (input)
            return;
        if (!placeholder)
            return;
        var context = element.getContext("2d");
        context.font = font;
        context.fillStyle = color;
        BrowserUtils.writeText(context, placeholder, 10,lineHeight);

    };
    var mouseMoveHandler = function(evt) {
        var event;
        if (state == STATE_POSITIONING) {
            var distance = {};
            distance.x = (cursorPositionOnDragStart.x - evt.clientX);
            distance.y = (cursorPositionOnDragStart.y - evt.clientY);
            origin.x = imagePostionOnDragStart.x - (distance.x);
            origin.y = imagePostionOnDragStart.y - (distance.y);
            event = document.createEvent('Event');
            event.initEvent("imageRepositioned", true, false);
            element.dispatchEvent(event);
        }
    };
    var canvasMouseDownHandler = function(evt) {
        if (state == STATE_IDLE) {
            cursorPositionOnDragStart.x = evt.clientX;
            cursorPositionOnDragStart.y = evt.clientY;
            imagePostionOnDragStart.x = origin.x;
            imagePostionOnDragStart.y = origin.y;
            window.addEventListener('mousemove', mouseMoveHandler);
            window.addEventListener('mouseup', canvasMouseUpHandler);
            state = STATE_POSITIONING;
        }
    };
    var canvasMouseUpHandler = function() {
        if (state == STATE_POSITIONING) {
            window.removeEventListener('mousemove', mouseMoveHandler);
            window.removeEventListener('mouseup', canvasMouseUpHandler);
            state = STATE_IDLE;
        }
    };
    var mouseWheelHandler = function(evt) {
        var delta = Math.max(-1, Math.min(evt.wheelDelta || -evt.detail));
        if (delta > 0) delta = 1;
        factor += (delta * 3 / 100);
        var event = document.createEvent('Event');
        event.initEvent('imageScale', true, false);
        element.dispatchEvent(event);
    };
    var init = function() {
        if (!element) {
            throw "The element must be provided";
        }
        if (config) {
            windowWidth = config.windowWidth ? config.windowWidth : (element.getAttribute('data-window-width') ? parseInt(element.getAttribute('data-window-width')) : element.width);
            windowHeight = config.windowHeight ? config.windowHeight : (element.getAttribute('data-window-height') ? parseInt(element.getAttribute('data-window-height')) : element.height);
            scaleX = config.scaleX ? config.scaleX : (element.getAttribute('data-scale-x') ? parseFloat(element.getAttribute('data-scale-x')) : 1);
            scaleY = config.scaleY ? config.scaleY : (element.getAttribute('data-scale-y') ? parseFloat(element.getAttribute('data-scale-y')) : 1);
            backgroundColor = config.backgroundColor ? config.backgroundColor : (element.getAttribute('data-background-color') ? element.getAttribute('data-background-color') : null);
            outputFormat = config.outputFormat ? config.outputFormat : (element.getAttribute('data-output-format') ? element.getAttribute('data-output-format') : 'jpeg');
            placeholder = config.placeholder ? config.placeholder : (element.getAttribute('placeholder') ? element.getAttribute('placeholder') : '');
            font = config.font ? config.font : (element.getAttribute('data-font') ? element.getAttribute('font') : '20px Georgia');
            color = config.color ? config.color : (element.getAttribute('data-color') ? element.getAttribute('data-color') : '#000000');
            lineHeight = config.lineHeight ? config.lineHeight : (parseInt(element.getAttribute('data-line-height')) ? parseInt(element.getAttribute('data-line-height')) : 20);
        } else {
            windowWidth = element.getAttribute('data-window-width') ? parseInt(element.getAttribute('data-window-width')) : element.width;
            windowHeight = element.getAttribute('data-window-height') ? parseInt(element.getAttribute('data-window-height')) : element.height;
            scaleX = element.getAttribute('data-scale-x') ? parseFloat(element.getAttribute('data-scale-x')) : 1;
            scaleY = element.getAttribute('data-scale-y') ? parseFloat(element.getAttribute('data-scale-y')) : 1;
            backgroundColor = element.getAttribute('data-background-color') ? element.getAttribute('data-background-color') : null;
            outputFormat = element.getAttribute('data-output-format') ? element.getAttribute('data-output-format') : 'jpeg';
            placeholder = element.getAttribute('placeholder') ? element.getAttribute('placeholder') : '';
            font = element.getAttribute('data-font') ? element.getAttribute('data-font') : '20px Georgia';
            color = element.getAttribute('data-color') ? element.getAttribute('data-color') : '#000000';
            lineHeight = element.getAttribute('data-line-height') ? parseInt(element.getAttribute('data-line-height')) : 20;
        }
        if (backgroundColor) {
            element.style.backgroundColor = backgroundColor;
        }
        writePlaceholder();
        element.ondragover = function() {
            addClass('hover');
            return false;
        };
        element.ondragleave = function() {
            removeClass('hover');
        };
        element.ondrop = function(e) {
            e.preventDefault();
            removeClass('hover');
            if (e.dataTransfer.files)
                draw(e.dataTransfer.files[0]);
        };
        element.onmousedown = canvasMouseDownHandler;
        if (BrowserUtils.getBrowserName() == BrowserUtils.browsers.firefox) {
            element.addEventListener('DOMMouseScroll', mouseWheelHandler);
        } else {
            element.onmousewheel = mouseWheelHandler;
        }
        element.addEventListener('imageScale', redraw);
        element.addEventListener('imageRepositioned', redraw);
    };
    if (arguments.length === 0) {
        //Se nenhum parâmetro foi informado
    } else {
        if (typeof arguments[0] === 'object') {
            config = arguments[0];
        } else if (typeof arguments[0] === 'string') {
            element = document.getElementById(arguments[0]);
            if (arguments.length > 1)
                config = arguments[1];
        }

    }
    init();
    return {
        getOutput: getOutput,
        getInputSize: getInputSize,
        getCurrentOffset: getCurrentOffset,
        getOutputSize: getOutputSize,
        getWindowSize: getWindowSize,
        getCurrentFactor: getCurrentFactor,
        getScale: getScale,
        sendOutput: sendOutput,
        sendInput: sendInput
    };
};