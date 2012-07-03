/**
 * KineticJS Line Extension
 * Compatible with KineticJS JavaScript Library v3.8.0
 * Author: Mateusz Sokoła, modified by Greg Zoller (arrow heads)
 * Date: Mar 12 2012
 */

///////////////////////////////////////////////////////////////////////
//  Line
///////////////////////////////////////////////////////////////////////
/**
 * Line constructor.  Line extends Shape
 * @constructor
 * @param {Object} config
 */
Kinetic.Line = function (config) {
    if (this._validatePoint([config.startPoint, config.endPoint])) {

        config.name = "Line";
        
        this.startPoint     = config.startPoint;
        this.endPoint       = config.endPoint;
        this.points 		= new Array()
        this.lineWidth      = (typeof config.lineWidth === "number") ? config.lineWidth : 5;
        this.color          = (typeof config.color !== "undefined") ? config.color : "black";
		this.hasArrow		= (typeof config.hasArrow !== "undefined") ? config.hasArrow : false;
		this.dashArray		= (typeof config.dashArray !== "undefined") ? config.dashArray : [];;
        // call super constructor
		config.drawFunc = (typeof config.drawFunc === "undefined") ? this._drawLine : config.drawFunc;
        Kinetic.Shape.apply(this, [config]);
        this.classType = "Line";
    }
};
/*
 * Line methods
 */
Kinetic.Line.prototype = {

    /**
     * validates point correctness
     * @param {array} args
     */
    _validatePoint: function (args) {
        var each = function (arr) {
            for (var i = 0; i < arr.length; i++) {
                if (typeof arr[i] === "object") {
                    if (typeof arr[i].x !== "number" || typeof arr[i].y !== "number") {
                        throw "Properties startPoint or/and endPoint does not contains properties x and y or these properties are not numeric";
                        return false;
                    }
                } else {
                    throw "Invalid type of properties startPoint or/and endPoint or these properties are not set";
                    return false;
                }
            }
            return true;
        }
        return each(args);
    },

    /**
     * draws line
     */
   /* _drawLine: function () {
        var context = this.getContext();
        context.save();
        context.beginPath();
        context.strokeStyle = this.color;
        context.lineWidth = this.lineWidth;
        context.moveTo(this.startPoint.x, this.startPoint.y);
        context.lineTo(this.endPoint.x, this.endPoint.y);
		if(this.hasArrow) {
			context.stroke();
			context.closePath();
			context.beginPath();
			var headlen = 13;   // length of head in pixels
			var angle = Math.atan2(this.endPoint.y-this.startPoint.y,this.endPoint.x-this.startPoint.x);
			context.lineJoin = "round";
			var ax = this.endPoint.x-headlen*Math.cos(angle-Math.PI/6);
			var ay = this.endPoint.y-headlen*Math.sin(angle-Math.PI/6);
			context.moveTo(this.endPoint.x, this.endPoint.y);
			context.lineTo(this.endPoint.x-headlen*Math.cos(angle+Math.PI/6),this.endPoint.y-headlen*Math.sin(angle+Math.PI/6));
			context.lineTo(ax,ay);
			context.fillStyle = this.color;
			context.fill();
		}
        context.stroke();
        context.closePath();
        context.restore();
    },*/

    _drawLine: function () {
        var context = this.getContext();
        var lastPos = {};
        context.beginPath();
        context.strokeStyle = this.color;
        context.lineWidth = this.lineWidth;
        //convert to point array
        this.points = new Array();
        this.points.push({x:this.startPoint.x, y:this.startPoint.y});
        this.points.push({x:this.endPoint.x, y:this.endPoint.y});
        context.moveTo(this.points[0].x, this.points[0].y);

        for(var n = 1; n < this.points.length; n++) {
            var x = this.points[n].x;
            var y = this.points[n].y;
            if(this.dashArray.length > 0) {
                // draw dashed line
                var lastX = this.points[n - 1].x;
                var lastY = this.points[n - 1].y;
                this._dashedLine(lastX, lastY, x, y, this.dashArray);
            }
            else {
                // draw normal line
                context.lineTo(x, y);
            }
        }
        if(this.hasArrow) {
			context.stroke();
			context.closePath();
			context.beginPath();
			var headlen = 13;   // length of head in pixels
			var angle = Math.atan2(this.endPoint.y-this.startPoint.y,this.endPoint.x-this.startPoint.x);
			context.lineJoin = "round";
			var ax = this.endPoint.x-headlen*Math.cos(angle-Math.PI/6);
			var ay = this.endPoint.y-headlen*Math.sin(angle-Math.PI/6);
			context.moveTo(this.endPoint.x, this.endPoint.y);
			context.lineTo(this.endPoint.x-headlen*Math.cos(angle+Math.PI/6),this.endPoint.y-headlen*Math.sin(angle+Math.PI/6));
			context.lineTo(ax,ay);
			context.fillStyle = this.color;
			context.fill();
		}
        context.stroke();
        context.closePath();
        context.restore();

    },
     _dashedLine: function(x, y, x2, y2, dashArray) {
        var context = this.getContext();
        var dashCount = dashArray.length;

        var dx = (x2 - x), dy = (y2 - y);
        var xSlope = dx > dy;
        var slope = (xSlope) ? dy / dx : dx / dy;

        /*
         * gaurd against slopes of infinity
         */
        if(slope > 9999) {
            slope = 9999;
        }
        else if(slope < -9999) {
            slope = -9999;
        }

        var distRemaining = Math.sqrt(dx * dx + dy * dy);
        var dashIndex = 0, draw = true;
        while(distRemaining >= 0.1 && dashIndex < 10000) {
            var dashLength = dashArray[dashIndex++ % dashCount];
            if(dashLength === 0) {
                dashLength = 0.001;
            }
            if(dashLength > distRemaining) {
                dashLength = distRemaining;
            }
            var step = Math.sqrt(dashLength * dashLength / (1 + slope * slope));
            if(xSlope) {
                x += dx < 0 && dy < 0 ? step * -1 : step;
                y += dx < 0 && dy < 0 ? slope * step * -1 : slope * step;
            }
            else {
                x += dx < 0 && dy < 0 ? slope * step * -1 : slope * step;
                y += dx < 0 && dy < 0 ? step * -1 : step;
            }
            context[draw ? 'lineTo' : 'moveTo'](x, y);
            distRemaining -= dashLength;
            draw = !draw;
        }

        context.moveTo(x2, y2);
    },

    /**
     * transforms line
     * @param {object} endPoint or startPoint
     * @param {object} endPoint (optional)
     */
    transform: function () {
    
        if (arguments.length !== 0) {

            if (this._validatePoint(arguments)) {

                if (arguments.length > 1) {

                    this.startPoint = arguments[0];
                    this.endPoint = arguments[1];

                } else {

                    this.endPoint = arguments[0];

                }
                this._drawLine();
                this.getLayer().draw();
            }

        } else {

            throw "Set at least one argument. Trigger: Kinetic.Line.transformLine";
            return null;

        }

    },

};
// extend Shape
Kinetic.GlobalObject.extend(Kinetic.Line, Kinetic.Shape);
