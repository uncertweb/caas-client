Kinetic.WorkFlowComponent = function (config)
{
	this.classType = "WorkFlowComponent";
	this.text = config.text;
	//we need to put a line break if too long, currently crude needs to be update
	this.setStroke = function (colour)
	{
		this.rect.setStroke(colour);
	};
	Kinetic.WorkFlowElement.apply(this, [{draggable:config.draggable,brokerProperties:config.brokerProperties}]);
	config = {
		  x:config.x,
		  y:config.y,
		  text:config.text,
		  width: this.textLength,
          height: 60,
          fill: "",
          stroke: "black",
          lineJoin: 'round',
          strokeWidth: 2,
          layer: config.layer,
          type:config.type,
          cornerRadius:5,
          draggable: config.draggable,
          fontsize: fontSize
	};
	
	//choose the colour based on what type of element this is
	//either mainRect of normal
	if(config.type == "mainRect")
	{
		config.fill = "#736AFF";
		array = new Array();
		array.push(config.text);
		config.text = config.text;
		ctx = config.layer.getContext();
		this.textLength = ctx.measureText(config.text).width;
		config.width = this.textLength;
        this.rect = new Kinetic.Rect(config);
        this.add(this.rect);
        
        xText = config.x + (this.textLength/2);
    	this.text = new Kinetic.Text({
          x: xText,
          y: config.y+10,
          text: config.text,
          fontSize: fontSize,
          fontFamily: "Calibri",
          textFill: "black",
          align: "center",
          verticalAlign: "middle"});
       	this.add(this.text);

    

	}
	else if(config.type == "addElement")
	{
		config.text = '[' + this.brokerProperties.annotation + '] ' + this.brokerProperties.name;
		this.title = config.text,
		config.fill = "#51A351";
		ctx = config.layer.getContext();
		split = config.text.length < 40 ? 40 : config.text.search(" ");
		ctx.font = 'normal 10pt Calibri';
		this.textLength = ctx.measureText(config.text.substring(0, split+5)).width;
		config.width = this.textLength;
		config.padding = 5;
		config.align = 'center';
		config.fontFamily = "Calibri";
        config.textFill = "black";
        config.fontSize = fontSize;
        this.rect = new Kinetic.Text(config);
        this.add(this.rect);

	}
	else
	{
		config.text = '[' + this.brokerProperties.annotation + '] ' + this.brokerProperties.name;
		this.title = config.text,
		config.fill = "#51A351";
		config.alpha = 1;
		//config.text = this.cleanText(config.text);
		ctx = config.layer.getContext();
		split = config.text.length < 40 ? 40 : config.text.search(" ");
		ctx.font = 'normal 10pt Calibri';
		this.textLength = ctx.measureText(config.text.substring(0, split+5)).width;
		config.width = this.textLength;
		config.padding = 10;
		config.align = 'center';
		config.fontFamily = "Calibri";
        config.textFill = "black";
        config.fontSize = fontSize;
        this.rect = new Kinetic.Text(config);
        this.add(this.rect);
		
	}
    this.config = config;
    var self = this;
    this.on("dragmove", function(ev) { 
    	this.updateAllVertices();
    });
    this.on("dragend", function(ev) { 
    	config.layer.checkOverBin(this,ev);
    });
		    
}

Kinetic.WorkFlowComponent.prototype = {

	moveToTop : function ()
	{
		this.rect.moveToTop();
		for(iTEl=0;iTEl<this.textElements.length;iTEl++)
		{
			this.textElements[iTEl].moveToTop();
		}
	},
	setAllPositions : function(config)
	{
    	this.rect.setPosition(config.x,config.y);
    	if(this.config.type == "mainRect")
    	{
    		xText = (config.x + this.rect.getAttrs().width/2) - (this.textLength/2);
	    	this.text.setPosition(xText,config.y+5);
    	}
	},
	updateAllVertices : function ()
	{
		for(CWi=0;CWi<this.vertices.length;CWi++) { this.vertices[CWi]._dragUpdate(); }
		
	},
	getHeight : function ()
	{
		return this.rect.getHeight();
	},
	getWidth : function()
	{
		return this.rect.getWidth();
	}
};

Kinetic.GlobalObject.extend(Kinetic.WorkFlowComponent, Kinetic.WorkFlowElement);

Kinetic.WorkFlowStart = function (config)
{
	this.vertices 	= new Array();
	this.classType = "WorkFlowStart";
	this.components = new Array();
	Kinetic.Group.apply(this, [{draggable:config.draggable}]);
	var textLength = config.text.length;
	radius = 15;
	
	this.circle = new Kinetic.Circle({
          x: config.x,
          y: config.y,
          radius: radius,
          fill: "#51A351",
          stroke: "black",
          strokeWidth: 2
    });
	this.add(this.circle);
	this.textElement = new Kinetic.Text({
          x: config.x - (radius-2),
          y: config.y+radius+10,
          text: "Start",
          fontSize: 10,
          fontFamily: "Calibri",
          textFill: "black",
          align: "center",
          verticalAlign: "middle"
    });
    this.setStroke = function (colour)
	{
		this.circle.setStroke(colour);
	};
    this.add(this.textElement);
    this.on("dragmove", function() { this.updateAllVertices(); });		    
}
Kinetic.WorkFlowStart.prototype = {
	connectTo : function (el)
	{
		connection = new Kinetic.Connection({start: this, end: el, lineWidth: 1, color: "black"}); 
		this.getLayer().add(connection);
	
	},
	connectToEl : function(el)
	{
		//need to connect this to the main element as thats the outer layer
		var connection = new Kinetic.Connection({start: this, end: el, lineWidth: 1, color: "black"}); 
		this.getLayer().add(connection);
	},
	addConnectionsToLayer : function ()
	{
		for(Vi=0;Vi<this.vertices.length;Vi++) { this.getLayer().add(this.vertices[Vi]); }

	},
	setAllPositions : function(config)
	{
	    this.textElement.setPosition(config.x-radius,config.y+radius+5);
    	this.circle.setPosition(config.x,config.y);
	},
 	updateAllVertices : function ()
	{
		for(i=0;i<this.vertices.length;i++) { this.vertices[i]._dragUpdate(); }
	},
	disconnectAllVertices : function ()
	{
		_.each(this.vertices,function(vert)
		{
			vert.remove();
		});
	},
	getHeight : function ()
	{
		return this.circle.getRadius().y;
	},
	getWidth : function()
	{
		return this.circle.getRadius().x;
	}


};
Kinetic.GlobalObject.extend(Kinetic.WorkFlowStart, Kinetic.Group);

Kinetic.WorkFlowEnd = function (config)
{
	this.vertices 	= new Array();
	this.classType = "WorkFlowEnd";
	this.components = new Array();
	Kinetic.Group.apply(this, [{draggable:config.draggable}]);
	var textLength = config.text.length;
	radius = 15;
	this.circle = new Kinetic.Circle({
          x: config.x,
          y: config.y,
          radius: radius,
          fill: "red",
          stroke: "black",
          strokeWidth: 2
    });
	this.add(this.circle);
    this.textElement = new Kinetic.Text({
          x: config.x - (radius-2),
          y: config.y+radius+10,
          text: "End",
          fontSize: 10,
          fontFamily: "Calibri",
          textFill: "black",
          align: "center",
          verticalAlign: "middle"
    });
    this.setStroke = function (colour)
	{
		this.circle.setStroke(colour);
	};
    this.add(this.textElement);

    this.on("dragmove", function() { this.updateAllVertices(); });		    
}
Kinetic.WorkFlowEnd.prototype = {
	connectTo : function (el)
	{
		connection = new Kinetic.Connection({start: this, end: el, lineWidth: 1, color: "black"}); 
		this.getLayer().add(connection);
	
	},
	connectToEl : function(el)
	{
		//need to connect this to the main element as thats the outer layer
		var connection = new Kinetic.Connection({start: this, end: el, lineWidth: 1, color: "black"}); 
		this.getLayer().add(connection);
	},
	setAllPositions : function(config)
	{
	    this.textElement.setPosition(config.x,config.y+radius+10);
    	this.circle.setPosition(config.x,config.y);
	},
	addConnectionsToLayer : function ()
	{
		for(Vi=0;Vi<this.vertices.length;Vi++) { this.getLayer().add(this.vertices[Vi]); }

	},
	disconnectAllVertices : function ()
	{
		_.each(this.vertices,function(vert)
		{
			vert.remove();
		});
	},
 	updateAllVertices : function ()
	{
		for(i=0;i<this.vertices.length;i++) { this.vertices[i]._dragUpdate(); }
		
	},
	getHeight : function ()
	{
		return this.circle.getRadius().y * 2;
	},
	getWidth : function()
	{
		return this.circle.getRadius().x * 2;
	}

};
Kinetic.GlobalObject.extend(Kinetic.WorkFlowEnd, Kinetic.Group);




Kinetic.Connection = function (config) {
	var r = config.start.rect;
	this.start = config.start;  // a Workflow or Element
	this.end   = config.end;  // a Workflow or Element
	this.line  = (typeof config.end !== "undefined") 
		? new Kinetic.Line({  // draw line, we have start + end points
						startPoint: this._getStartPt(config.start,config.end),
						endPoint  : this._getEndPt(config.start,config.end),
						lineWidth : config.lineWidth,
						color     : config.color,
						hasArrow  : true,
						dashArray: config.dashArray
					}) 
		: new Kinetic.Bezier({ // draw curve, we have only start -- self-referencing vertex
						startPoint 		: {x:r.attrs.x+r.getWidth()/2,y:r.attrs.y+r.getHeight()},
						endPoint 		: {x:r.attrs.x+r.getWidth()/4,y:r.attrs.y+r.getHeight()},
						controlPoint1 	: {x:r.attrs.x+r.getWidth()/2,y:r.attrs.y+r.getHeight()+40},
						controlPoint2 	: {x:r.attrs.x+r.getWidth()/4,y:r.attrs.y+r.getHeight()+40},
						lineWidth		: config.lineWidth,
						color			: config.color,
						hasArrow  		: true
					});	
	Kinetic.Group.apply(this, [config]);
	this.classType = "Connection";
	this.add(this.line);
	this.dashArray = config.dashArray;
	this.start.vertices.push(this);
	if( typeof config.end !== "undefined" ) this.end.vertices.push(this);
	
	this.on("mouseover",function() { document.body.style.cursor="pointer"; });
	this.on("mouseout",function()  { document.body.style.cursor="default"; });
};

Kinetic.Connection.prototype = {
	_dragUpdate : function() { 
		if( this.line.classType == "Line" )
			this.line.transform(this._getStartPt(this.start,this.end), this._getEndPt(this.start,this.end));	
		else { // move curve
			var r = this.start.rect;
			var dx = r.getAbsolutePosition().x - (this.line.startPoint.x - r.getWidth()/2);
			var dy = r.getAbsolutePosition().y - (this.line.startPoint.y - r.getHeight());
			this.line.transform({dx:dx,dy:dy});
		}
	},
	_getStartPt : function( el1, el2 ) {
		if(el1 instanceof Kinetic.WorkFlow)
		{
			var r1  = el1.mainElement.rect;
		}
		else if (el1 instanceof Kinetic.WorkFlowStart || el1 instanceof Kinetic.WorkFlowEnd)
		{
			//then its not a c
			var r1  = el1.circle;
		}
		else
		{
			var r1  = el1.rect;
		}
		if(el2 instanceof Kinetic.WorkFlow)
		{
			var r2  = el2.mainElement.rect;
		}
		else if (el2 instanceof Kinetic.WorkFlowStart || el2 instanceof Kinetic.WorkFlowEnd)
		{
			//then its not a c
			var r2  = el2.circle;
		}
		else
		{
			var r2  = el2.rect;
		}
		
			if(r1 instanceof Kinetic.Circle)
			{
				switch( this._getOrientation(r1,r2) ) {
					case 1:
						return {
							x:r1.getAbsolutePosition().x + r1.getRadius().x, 
							y:r1.getAbsolutePosition().y
						}
						break;
					case 2:
						return {
							x:r1.getAbsolutePosition().x - r1.getRadius().x, 
							y:r1.getAbsolutePosition().y
						}
						break;
					case 3:
						return {
							x:r1.getAbsolutePosition().x, 
							y:r1.getAbsolutePosition().y + r1.getRadius().x
						}
						break;
					case 4:
						return {
							x:r1.getAbsolutePosition().x, 
							y:r1.getAbsolutePosition().y - r1.getRadius().x
						}
						break;
				}
			}
			else
			{
				switch( this._getOrientation(r1,r2) ) {
					case 1:
						return {
							x:r1.getAbsolutePosition().x + r1.getAttrs().width, 
							y:r1.getAbsolutePosition().y + r1.getAttrs().height/2
						}
						break;
					case 2:
						return {
							x:r1.getAbsolutePosition().x, 
							y:r1.getAbsolutePosition().y + r1.getAttrs().height/2
						}
						break;
					case 3:
						return {
							x:r1.getAbsolutePosition().x + r1.getAttrs().width/2, 
							y:r1.getAbsolutePosition().y + r1.getAttrs().height
						}
						break;
					case 4:
						return {
							x:r1.getAbsolutePosition().x + r1.getAttrs().width/2, 
							y:r1.getAbsolutePosition().y
						}
						break;
				}
			}
		
	},
	_getEndPt : function( el1, el2 ) {
		if(el1 instanceof Kinetic.WorkFlow)
		{
			var r1  = el1.mainElement.rect;
		}
		else if (el1 instanceof Kinetic.WorkFlowStart || el1 instanceof Kinetic.WorkFlowEnd)
		{
			//then its not a c
			var r1  = el1.circle;
		}
		else
		{
			var r1  = el1.rect;
		}
		if(el2 instanceof Kinetic.WorkFlow)
		{
			var r2  = el2.mainElement.rect;
		}
		else if (el2 instanceof Kinetic.WorkFlowStart || el2 instanceof Kinetic.WorkFlowEnd)
		{
			//then its not a c
			var r2  = el2.circle;
		}
		else
		{
			var r2  = el2.rect;
		}
		
			if(r2 instanceof Kinetic.Circle)
			{
				switch( this._getOrientation(r1,r2) ) {
					case 1:
						return {
							x:r2.getAbsolutePosition().x - r2.getRadius().x, 
							y:r2.getAbsolutePosition().y
						}
						break;
					case 2:
						return {
							x:r2.getAbsolutePosition().x + r2.getRadius().x, 
							y:r2.getAbsolutePosition().y
						}
						break;
					case 3:
						return {
							x:r2.getAbsolutePosition().x, 
							y:r2.getAbsolutePosition().y - r2.getRadius().x
						}
						break;
					case 4:
						return {
							x:r2.getAbsolutePosition().x, 
							y:r2.getAbsolutePosition().y + r2.getRadius().x
						}
						break;
				}
			}
			else
			{
				switch( this._getOrientation(r1,r2) ) {
					case 1:
						return {
							x:r2.getAbsolutePosition().x, 
							y:r2.getAbsolutePosition().y + r2.getAttrs().height/2
						}
						break;
					case 2:
						return {
							x:r2.getAbsolutePosition().x + r2.getAttrs().width, 
							y:r2.getAbsolutePosition().y + r2.getAttrs().height/2
						}
						break;
					case 3:
						return {
							x:r2.getAbsolutePosition().x + r2.getAttrs().width/2, 
							y:r2.getAbsolutePosition().y
						}
						break;
					case 4:
						return {
							x:r2.getAbsolutePosition().x + r2.getAttrs().width/2, 
							y:r2.getAbsolutePosition().y + r2.getAttrs().height
						}
						break;
				}
			}
	},
	remove : function()
	{
		this.start.vertices.splice(_.indexOf(this.start.vertices,this),1);
		this.end.vertices.splice(_.indexOf(this.end.vertices,this),1);
		this.getLayer().remove(this);
		
	},
	//gets where the object are in terms of each other, so you can connect to the correct side
	_getOrientation : function(box1, box2 ) {  // 1=left, 2=right, 3=above, 4=below
		var pos1 = box1.getAbsolutePosition();
		var pos2 = box2.getAbsolutePosition();
		if(box1 instanceof Kinetic.Circle)
		{
			if( pos1.x + box1.getRadius().x <= pos2.x ) { return 1; }
			if( pos2.x + box2.getAttrs().width <= pos1.x ) {  return 2 }
			if( box1.getAbsolutePosition().y >= box2.getAbsolutePosition().y ) { return 4; }
			return 3;
		}
		if(box2 instanceof Kinetic.Circle)
		{
			if( pos2.x + box2.getRadius().x <= pos1.x ) {  return 2; }
			if( pos1.x + box1.getAttrs().width <= pos2.x ) {  return 1; }
			if( box1.getAbsolutePosition().y >= box2.getAbsolutePosition().y ) { return 4; }
			return 3;
		}
		if( pos1.x + box1.getAttrs().width <= pos2.x ) { return 1; }
		if( pos2.x + box2.getAttrs().width <= pos1.x ) {  return 2 }
		if( box1.getAbsolutePosition().y >= box2.getAbsolutePosition().y ) { return 4; }
		return 3;
	}
};
// extend Group
Kinetic.GlobalObject.extend(Kinetic.Connection, Kinetic.Group);
