var fontSize = 10;

Kinetic.WorkFlow = function (config)
{
	this.vertices 	= new Array();
	
	Kinetic.Group.apply(this, [{draggable:config.draggable}]);
	this.classType = "WorkFlow";
	this.components = new Array();
	
	
	//mainElement is the box around the entire workflow. All other elements sit inside this
	this.standAlone = config.standalone;
	if(this.standAlone == true)
	{
		//create the start element for the workflow
		//put it in the centre of the stage
		
		this.startElement = new Kinetic.WorkFlowStart({x:config.layer.getStage().getWidth()/2, y:30,text:"Start",draggable:true});
		this.add(this.startElement);
	}
	else
	{
		//newXY = config.layer.findNextPositionVertical();
		this.mainElement = new Kinetic.WorkFlowElement({draggable:true,text:config.text,brokerProperties:config.brokerProperties,x:config.x,y:config.y,type:"mainRect",layer:config.layer});
		this.add(this.mainElement);
		//create the start element for the workflow
		this.startElement = new Kinetic.WorkFlowStart({x:this.mainElement.rect.getPosition().x + 20, y:this.mainElement.rect.getPosition().y+60,text:"Start"});
	
		this.add(this.startElement);
	
		//move the mainElement to the bottom, so Workflows can be seen
		this.mainElement.moveToBottom();
		
		this.on("dblclick",function()
		{
			//here we want to clear the screen and just render this workflow
			config.layer.renderWorkFlow(this);
		
		});

	}

	//update the size of the element, to ensure it covers all internal elements
	this.updateSizeAndPosOfMainEl();
	this.on("dragmove", function() 
	{ 
		this.updateAllVertices();
		
	});
		
	
	
	
}
Kinetic.WorkFlow.prototype = {

 	addElement : function(config)  
	{  
		
		config.text = '[' + config.brokerProperties.annotation + '] ' + config.brokerProperties.title;
		//create new group for rectangle and text
		if(this.standAlone)
		{
			ctx = config.layer.getContext();
			TL = ctx.measureText(config.text.substring(0, 40)).width * 1.5;
			position = this.findWhereToPutNewElement(TL);
			comGroup = new Kinetic.WorkFlowElement({draggable:true,text:config.text,x:position.x,y:position.y,type:"addElement",layer:config.layer,brokerProperties:config.brokerProperties});
		}
		else
		{
			ctx = config.layer.getContext();
			TL = ctx.measureText(config.text.substring(0, 40)).width * 1.5;
			position = this.findWhereToPutNewElement(TL);
			comGroup = new Kinetic.WorkFlowElement({draggable:false,text:config.text,x:position.x,y:position.y,type:"addElement",layer:config.layer,brokerProperties:config.brokerProperties});
		}
		
		//need to connect it to the element before, or the start
	    if(this.components.length == 0)
	    {
	    	//connect to the start
	    	this.startElement.connectTo(comGroup);
	    }
	    else
	    {
	    	this.components[this.components.length -1].connectTo(comGroup);
	    }
	    
	    this.components.push(comGroup);
	    this.add(comGroup);
	    
	    
	    //need to expand the main to ensure that it covers all elements
	    this.updateSizeAndPosOfMainEl();
	    if(this.standalone==false){this.mainElement.moveToBottom();}
	    this.moveComponentsToTop();
	    
	},
	updateAllVertices : function ()
	{
		if(this.standAlone ==false || this.standAlone == undefined)
		{
			this.mainElement.updateAllVertices();
			for(Vi=0;Vi<this.vertices.length;Vi++) { this.vertices[Vi]._dragUpdate(); }

		}
		
		
		for(Ci=0;Ci<this.components.length;Ci++) { this.components[Ci].updateAllVertices(); }
		this.startElement.updateAllVertices();
	},
	connectTo : function (el)
	{
		//need to connect this to the main element as thats the outer layer
		connection = new Kinetic.Connection({start: this, end: el, lineWidth: 1, color: "black"}); 
		this.getLayer().add(connection);

	
	},
	addConnectionsToLayer : function ()
	{
		for(Vi=0;Vi<this.vertices.length;Vi++) { this.getLayer().add(this.vertices[Vi]); }
		if(this.standAlone ==false)
		{
			this.mainElement.addConnectionsToLayer();
		}
		
		
		for(Ci=0;Ci<this.components.length;Ci++) { this.components[Ci].addConnectionsToLayer(); }
		this.startElement.addConnectionsToLayer();

	},
	setVertices : function (verticesArray,wFlow)
	{
		for(Vi=0;Vi<verticesArray.length;Vi++) 
		{ 
			if(_.isEqual(verticesArray[Vi].start,wFlow))
			{
				verticesArray[Vi].start = this;
			}
			if(_.isEqual(verticesArray[Vi].end,wFlow))
			{
				verticesArray[Vi].end = this;
			} 
		}
		this.vertices = verticesArray;
	},
	updateSizeAndPosOfMainEl : function()
	{
		//if standalone, then do not need to update the size
		if(this.standAlone) { return;}
		//updates the size to ensure that all components in the workflow are covered, by the rect in the background
		this.mainElement.rect.setSize(this.updateSizeOfMainElement().w,this.updateSizeOfMainElement().h);
	    //this.mainElement.rect.setAbsolutePosition(this.updateSizeOfMainElement().x,this.updateSizeOfMainElement().y);
	    xText = this.mainElement.rect.getAbsolutePosition().x + (this.mainElement.textLength/2 + (this.mainElement.textLength/fontSize));
	    //this.mainElement.textElement.setAbsolutePosition(xText,this.mainElement.rect.getAbsolutePosition().y+10);
	    //ensure the group as a whole is not overlapping, if it is then it needs to be moved
	    
	},
	moveComponentsToTop : function()
	{
		for(i=0;i<this.components.length;i++) 
		{ 
			this.components[i].moveToTop(); 
		}
	},
	findWhereToPutNewElement : function(width)
	{
	
		//first we need to find the size of the new element
		
		if(this.standAlone)
		{
			//we want to align elements under each other
			
			if(this.components.length == 0)
			{
				//if there is only a start then just place it under that
				position = {x:(this.startElement.circle.getPosition().x-(width/2)),y:(this.startElement.circle.getPosition().y+(this.startElement.circle.getAttrs().radius + 30))};
			
			}
			else
			{
				//as there are other elements we need t, put it next ot that
				lastShape = this.components[this.components.length-1].rect;				
				xPos = ((lastShape.getPosition().x + (lastShape.getWidth()/2)) - width/2)
				position = {x:xPos,y:(lastShape.getPosition().y + lastShape.getSize().height+40)}
				
			}
		}
		else
		{
			if(this.components.length == 0)
			{
				//if there is only a start then just place it under that
				position = {x:(this.startElement.circle.getPosition().x+this.startElement.circle.getAttrs().radius+20),y:(this.startElement.circle.getPosition().y-30)};
			
			
			}
			else
			{
				//as there are other elements we need t, put it next ot that
				lastShape = this.components[this.components.length-1].rect;
				position = {x:(lastShape.getPosition().x+lastShape.getSize().width +20),y:(lastShape.getPosition().y)}
				
			}
		}
		
		
		return position;
				
		
	},
	updateSizeOfMainElement : function()
	{
		smallestX = -1;
		biggestX = -1;
		biggestY = -1;
		smallestX = -1;
		if(this.components.length == 0)
		{
			smallestX = (this.startElement.circle.getAbsolutePosition().x-this.startElement.circle.getAttrs().radius)
			
			smallestY = (this.startElement.circle.getAbsolutePosition().y-this.startElement.circle.getAttrs().radius)
		
			biggestX = (this.startElement.circle.getAbsolutePosition().x+this.startElement.circle.getAttrs().radius)
		
			biggestY = (this.startElement.circle.getAbsolutePosition().y+this.startElement.circle.getAttrs().radius)
			
			if((this.mainElement.textLength)+20>(biggestX-smallestX))
			{
				return {w:((this.mainElement.textLength)+20),h:(biggestY-smallestY)+50,x:smallestX-20,y:smallestY-30};
			}
			else
			{
				return {w:(biggestX-smallestX)+40,h:(biggestY-smallestY)+50,x:smallestX-20,y:smallestY-30};
			}
				
		}
		else
		{
		
			for(i=0;i<this.components.length;i++) 
			{ 
				if(smallestX == -1)
				{
					smallestX = this.components[i].rect.getAbsolutePosition().x;
					biggestX = this.components[i].rect.getAbsolutePosition().x + this.components[i].rect.getAttrs().width;
					smallestY = this.components[i].rect.getAbsolutePosition().y
					biggestY = this.components[i].rect.getAbsolutePosition().y + this.components[i].rect.getAttrs().height;
				}
				if(this.components[i].rect.getAbsolutePosition().x < smallestX)
				{
					smallestX = this.components[i].rect.getAbsolutePosition().y;
				}
				if(this.components[i].rect.getAbsolutePosition().y < smallestY)
				{
					smallestY = this.components[i].rect.getAbsolutePosition().y;
				}
				
				if((this.components[i].rect.getAbsolutePosition().x + this.components[i].rect.getAttrs().width) > biggestX)
				{
					biggestX = (this.components[i].rect.getAbsolutePosition().x + this.components[i].rect.getAttrs().width);
				}
				if((this.components[i].rect.getAbsolutePosition().y + this.components[i].rect.getAttrs().height) > biggestY)
				{
					biggestY = (this.components[i].rect.getAbsolutePosition().y + this.components[i].rect.getAttrs().height);
				}
			}
		}
		//check the startElement to see if that contains the smallest or biggest of x and y
		if(smallestX>(this.startElement.circle.getAbsolutePosition().x-this.startElement.circle.getAttrs().radius))
		{
			smallestX = (this.startElement.circle.getAbsolutePosition().x-this.startElement.circle.getAttrs().radius)
		}
		if(smallestY>(this.startElement.circle.getAbsolutePosition().y-this.startElement.circle.getAttrs().radius))
		{
			smallestY = (this.startElement.circle.getAbsolutePosition().y-this.startElement.circle.getAttrs().radius)
		}
		if(biggestX<(this.startElement.circle.getAbsolutePosition().y+this.startElement.circle.getAttrs().radius))
		{
			biggestX = (this.startElement.circle.getAbsolutePosition().x+this.startElement.circle.getAttrs().radius)
		}
		if(biggestY<(this.startElement.circle.getAbsolutePosition().y+this.startElement.circle.getAttrs().radius))
		{
			biggestY = (this.startElement.circle.getAbsolutePosition().y+this.startElement.circle.getAttrs().radius)
		}
		if((this.mainElement.textLength)+20>(biggestX-smallestX))
		{
			return {w:((this.mainElement.textLength)+40),h:(biggestY-smallestY)+50,x:smallestX-20,y:smallestY-30};
		}
		else
		{
			return {w:(biggestX-smallestX)+40,h:(biggestY-smallestY)+50,x:smallestX-20,y:smallestY-30};
		}

		
	},
	setAllPositions : function (config)
	{
		mainPos = this.mainElement.rect.getPosition();
		offset = {x:0,y:0};
		//we have to set the components relative to the offset from the mainRect x,y
		for(iC=0;iC<this.components.length;iC++)
		{
			cRect = this.components[iC].rect.getPosition();
			offset.y = cRect.y - mainPos.y;
			offset.x = cRect.x - mainPos.x;
			this.components[iC].setAllPositions({x:config.x+offset.x,y:config.y+offset.y});
		}
		offset.y = this.startElement.circle.getPosition().y - mainPos.y;
		offset.x = this.startElement.circle.getPosition().x - mainPos.x;
		this.startElement.setAllPositions({x:config.x+offset.x,y:config.y+offset.y});
		this.mainElement.setAllPositions({x:config.x,y:config.y});
	},	
	getHeight : function ()
	{
		return this.mainElement.getHeight();
	},
	getWidth : function()
	{
		return this.mainElement.getWidth();
	}

};

Kinetic.GlobalObject.extend(Kinetic.WorkFlow, Kinetic.Group);



