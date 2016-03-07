var SimpleCanvas = (function () {

    var containsNonPrintableChars = function (text) {
        return /[^\040-\176]/.test(text);
    };
    
    var truncate = function(number) {
        return Math[number < 0 ? 'ceil' : 'floor'](number);
    };

    var createCanvas = function (options) {
        var canvas = $("<canvas>");
        canvas.attr('width', options.width);
        canvas.attr('height', options.height);
        
        return canvas[0];
    };
    
    var Property = function (actions) {
        return function () {
            var args = arguments;
            if (args.length == 0) {
                return actions.get();
            }
            
            return actions.set(args[0]);
        };
    };
    
    var parseRenderPoint = function (obj, fallbackValue) {
        
        if (!obj) return fallbackValue;
        if ($.isPlainObject(obj)) {
            return {
                x: obj.x || 0,
                y: obj.y || 0
            }
        }
        
        if ($.isArray(obj)) {
            return {
                x: obj[0] || 0,
                y: obj[1] || 0
            }
        }
        
        throw obj + " is not recognized as valid point defination";
    };
    
    var createFont = function (face, size, fallbackValues) {
        
        if (face) {
            if (typeof face != "string")
                throw face + " is not a valid font face";
        } else {
            face = fallbackValues.defaultFontFace;
        }

        if (size) {
            if (!$.isNumeric(size) || size < 0)
                throw size + " is not a valid font size";   
        } else {
            size = fallbackValues.defaultFaceSize;
        }
            
        return size + "px " + face;
    };
    
    var Simple2DContextWrapper = function (options, context) {
        
        this.drawText = function (text, point, fontSize, fontColor, fontFace) {
            
            if (!text) return; // Nothing to draw
            point = parseRenderPoint(point, options.defaultRenderPosition);
            fontColor = fontColor || options.defaultFaceColor;
        
            context.font = createFont(fontFace, fontSize, options);
            context.fillStyle = fontColor;
            
            // Disallow non-printing characters
            if (containsNonPrintableChars(text)) {
                throw "text may not contain non-printing characters";
            }

            context.fillText(text, point.x, point.y);
        };
        
        this.drawLine = function(point1, point2, width, color) {
            
            point1 = parseRenderPoint(point1, options.defaultRenderPosition);
            point2 = parseRenderPoint(point2, options.defaultRenderPosition);
            
            if (!$.isNumeric(width)) {
                throw "width must be a number";
            }
            
            if (width <= 0) {
                throw "width must be a positive number";
            };
            
            context.lineWidth = width;
            context.strokeStyle = color;
            
            context.beginPath();
            context.moveTo(point1.x, point1.y);
            context.lineTo(point2.x, point2.y);
            context.stroke();
        };
        
        this.drawPolyline = function(points, width, color) {
            
            if (!$.isArray(points)) {
                throw "points must be a sequence";
            }
            
            if (!$.isNumeric(width)) {
                throw "width must be a number";
            }
            
            if (width <= 0) {
                throw "width must be a positive number";
            };
            
            context.lineWidth = width;
            context.strokeStyle = color;
            
            context.beginPath();
            $.each(points, function (i, point) {
                point = parseRenderPoint(point, options.defaultRenderPosition);
                if (i == 0) {
                    context.moveTo(point.x, point.y);        
                } else {
                    context.lineTo(point.x, point.y);
                }
            });
            
            context.stroke();
        };
        
        this.drawPolygon = function(points, linewidth, linecolor, fillcolor) {
            
            if (!$.isArray(points)) {
                throw "points must be a sequence";
            }
            
            if (!$.isNumeric(linewidth)) {
                throw "width must be a number";
            }
            
            if (linewidth <= 0) {
                throw "width must be a positive number";
            };

            context.lineWidth = linewidth;
            context.strokeStyle = linecolor;
            if (fillcolor) {
                context.fillStyle = fillcolor;
            };
            
            context.beginPath();
            $.each(points, function (i, point) {
                point = parseRenderPoint(point, options.defaultRenderPosition);
                if (i == 0) {
                    context.moveTo(point.x, point.y);        
                } else {
                    context.lineTo(point.x, point.y);
                }
            });
            context.stroke();
            
            if (points.length > 0) {
                var point = parseRenderPoint(points[points.length - 1], options.defaultRenderPosition);
                context.lineTo(point.x, point.y);
            }
            
            context.closePath();
            if (fillcolor) {
                context.fill();
            };
            context.stroke();
        };
        
        this.drawCircle = function(center, radius, linewidth, linecolor, fillcolor) {
            
            center = parseRenderPoint(center, options.defaultRenderPosition);
            if (!$.isNumeric(radius)) {
                throw "radius must be a number";
            };
            
            if (radius <= 0) {
                throw "radius must be a positive number";                
            };
            
            if (!$.isNumeric(linewidth)) {
                throw "linewidth must be a number";
            };
            
            if (linewidth <= 0) {
                throw "linewidth must be a positive number";
            };
            
            context.lineWidth = linewidth;
            context.strokeStyle = linecolor;
            if (fillcolor) {
                context.fillStyle = fillcolor;
            };
            
            context.beginPath();
            context.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
            
            if (fillcolor) {
                context.fill();
            };
            context.stroke();
        };
        
        this.drawPoint = function(point, color) {
            
            point = parseRenderPoint(point, options.defaultRenderPosition);
            
            context.fillStyle = color;
            context.fillRect(point.x, point.y, 1, 1);
        };
        
        this.drawImage = function(image, sourcePosition, sourceDimension, destinationPosition, destinationDimension, rotationAngle) {
            
            if (!image || !image.$image) {
                throw "image is not a valid image. Use canvas.loadImage to load one";
            } else {
                image = image.$image;
            }
            
            sourcePosition = parseRenderPoint(sourcePosition, options.defaultRenderPosition);
            sourceDimension = parseRenderPoint(sourceDimension, options.defaultRenderPosition);
            
            destinationPosition = parseRenderPoint(destinationPosition, sourcePosition);
            destinationDimension = parseRenderPoint(destinationDimension, sourceDimension);
            
            rotationAngle = rotationAngle || 0;

            var sourceX = sourcePosition.x;
            var sourceY = sourceDimension.y;
            var sourceWidth = sourceDimension.x;
            var sourceHeight = sourceDimension.y;
            
            var destinationX = destinationPosition.x;
            var destinationY = destinationPosition.y;
            var destinationWidth = destinationDimension.x;
            var destinationHeight = destinationDimension.y;

            if (sourceWidth <= 0 || sourceDimension.y <= 0 ||
                destinationDimension.x <= 0 || destinationDimension.y <= 0) {
                throw "image dimensions must be > 0";
            };

            sourceX = truncate(sourceX - sourceWidth / 2);
            sourceY = truncate(sourceY - sourceHeight / 2);
            
            var destinationOffsetX = truncate(- destinationWidth / 2);
            var destinationOffsetY = truncate(- destinationHeight / 2);

            if (sourceX < 0 || sourceY < 0) {
                // Do not draw anything
                return;
            };
            
            context.save();
            context.translate(destinationX, destinationY);
            context.rotate(rotationAngle);
            
            context.drawImage(image, 
                              sourceX, sourceY, sourceWidth, sourceHeight,
                              destinationOffsetX, destinationOffsetY, destinationWidth, destinationWidth);
                            
            context.restore();
        };
    };
    
    var Image = function(path) {
        
        var self = this;
        self.$image = new window.Image();
        self.$image.src = path;
        
        this.__defineGetter__('width', function () {
            return self.$image.width; 
        });

        this.__defineGetter__('height', function () {
            return self.$image.height; 
        });
    };
    
    var SimpleCanvas = function (dom, options) {
        
        var self = this;
        self.$options = $.extend({}, SimpleCanvas.defaultOptions, options);
        
        self.$canvas = createCanvas(self.$options);
        self.$context = self.$canvas.getContext('2d');
        if (!self.$context || !self.$context.drawImage) {
            throw "Unsupported browser. Canvas doesn't support rendering";
        }
        
        self.$drawContext = new Simple2DContextWrapper(self.$options, self.$context);
        dom.append(self.$canvas);
        
        this.background = Property({
            get: function () {
                return self.$options.background;
            },
            set: function (value) {
                self.$options.background = value;
            }
        });
        
        this.start = function (drawCallback) {
            
            if (!$.isFunction(drawCallback)) {
                throw "drawCallback is expected to be a function";  
            };
            
            // Functions for built-in browser animation callback
            var draw = function () {
                self.$context.fillStyle = self.background();
                self.$context.fillRect(0, 0, self.$canvas.width, self.$canvas.height);
                
                try {
                    drawCallback(self.$drawContext);   
                } catch (e) {
                    self.stop();
                    throw e;
                }
            };

            var animate = function () {
                self.$animationId = window.requestAnimationFrame(animate);
                draw();
            };

            self.$animationId = window.requestAnimationFrame(animate);
        };
        
        this.stop = function () {
            window.cancelAnimationFrame(self.$animationId);
        };
        
        this.measureTextSize = function (text, size, face) {
            self.$context.font = createFont(face, size, self.$options);
            return self.$context.measureText(text);
        };
        
        var eventListeners = {};
        var canvasCoords = function(canvas, evt) {
            // Get canvas position
            var curr = canvas;
            var top = 0;
            var left = 0;
            while (curr && curr.tagName != 'BODY') {
                top  += curr.offsetTop;
                left += curr.offsetLeft;
                curr = curr.offsetParent;
            }

            // Return relative mouse position
            return {
                x: evt.pageX - left,
                y: evt.pageY - top
            };                
        };
        
        self.$canvas.onclick = function (evt) {
            
            var listeners = eventListeners['click'];
            if (!listeners || listeners.length === 0) return;
            
            var coords = canvasCoords(self.canvas, evt);
            
            // Adjust position to remove border
            var x = coords.x - self.$options.borderSize;
            var y = coords.y - self.$options.borderSize;
            if ((x < 0) || (x >= self.width) || (y < 0) || (y >= self.height)) {                    
                // Click was in border
                return;
            };
            
            var pos = [x, y];
            $.each(listeners, function (i, callback) {
                callback(pos); 
            });
        };
        
        this.on = function(event, callback) {
            var listeners = eventListeners[event];
            if (!listeners) {
                listeners = [];
                eventListeners[event] = listeners;
            }
            
            listeners.push(callback);
        };
        
        this.off = function(event, callback) {
            var listeners = eventListeners[event];
            if (!listeners) {
                return;
            }
            
            if (!callback) {
                delete eventListeners[event];
            } else {
                listeners.remove(callback);
            }
        };
        
        this.loadImage = function(imagePath) {
            return new Image(imagePath);
        };
    };
    
    SimpleCanvas.defaultOptions = {
        height: 300,
        width: 300,
        background: '#000',
        defaultFaceColor: '#fff',
        defaultFontFace: "serif",
        defaultFaceSize: 12,
        borderSize: 0,
        defaultRenderPosition: {
            x:0,
            y:0
        }
    };
    
    (function () {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var i = 0; i < vendors.length && !window.requestAnimationFrame; i++) {
            window.requestAnimationFrame = window[vendors[i] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame =
                window[vendors[i] + 'CancelAnimationFrame'] || window[vendors[i] + 'CancelRequestAnimationFrame'];
        }
        
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                
                var id = window.setTimeout(function() {
                    callback(currTime + timeToCall);
                }, timeToCall);
                
                lastTime = currTime + timeToCall;
                return id;
            };
        }
        
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = clearTimeout.bind(window);
        } 
    })();
    
    return SimpleCanvas;
})();