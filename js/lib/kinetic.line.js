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
        this.lineWidth      = (typeof config.lineWidth === "number") ? config.lineWidth : 5;
        this.color          = (typeof config.color !== "undefined") ? config.color : "black";
		this.hasArrow		= (typeof config.hasArrow !== "undefined") ? config.hasArrow : false;

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
    _drawLine: function () {
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
