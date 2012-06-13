var fontSize = 10;

Kinetic.WorkFlow = function (config)
{
	this.vertices 	= new Array();
	Kinetic.Group.apply(this, [config]);
	this.classType = "WorkFlow";
	this.components = new Array();
	//mainElement is the box around the entrie workflow. All other elements sit inside this
	//we might not need this if it is the main workflow or the only one
	this.mainElement = new Kinetic.WorkFlowElement({draggable:true,text:config.text,x:config.x,y:config.y,type:"mainRect",stage:config.stage});
	
	this.add(this.mainElement);
	

	//start element for this workflow
	this.startElement = new Kinetic.WorkFlowStart({x:this.mainElement.rect.getPosition().x + 20, y:this.mainElement.rect.getPosition().y+30,text:"Start"});
	
	this.add(this.startElement);
	//we should update the position of the group to ensure it is not over another
	newXY = config.stage.checkXY({x:this.mainElement.rect.getAbsolutePosition().x,y:this.mainElement.rect.getAbsolutePosition().y,w:this.mainElement.rect.getAttrs().width,h:this.mainElement.rect.getAttrs().height});
	this.setAbsolutePosition(newXY.x,(newXY.y/2)-this.startElement.circle.getAttrs().radius);
	
	
	this.mainElement.moveToBottom();
	this.updateSizeAndPosOfMainEl();
	this.on("dragmove", function() 
	{ 
		this.updateAllVertices();
		
	});
	
	
	
	
}
Kinetic.WorkFlow.prototype = {

 	addElement : function(config)  
	{  
		position = this.findWhereToPutNewElement(config.text);
		//create new group for rectangle and text
		comGroup = new Kinetic.WorkFlowElement({draggable:false,text:config.text,x:position.x,y:position.y,type:"addElement",stage:config.stage});
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
	    this.mainElement.moveToBottom();
	    this.moveComponentsToTop();
	    //this.updateAllVertices();
	},
	updateAllVertices : function ()
	{
		for(Vi=0;Vi<this.vertices.length;Vi++) { this.vertices[Vi]._dragUpdate(); }
		this.mainElement.updateAllVertices();
		this.startElement.updateAllVertices();
		for(Ci=0;Ci<this.components.length;Ci++) { this.components[Ci].updateAllVertices(); }

	},
	connectTo : function (el)
	{
		//need to connect this to the main element as thats the outer layer
		connection = new Kinetic.Connection({start: this, end: el, lineWidth: 1, color: "black"}); 
		this.getLayer().add(connection);

	
	},
	updateSizeAndPosOfMainEl : function()
	{
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
	findWhereToPutNewElement : function(text)
	{
	
		//first we need to find the size of the new element
		size = {w: (text.length*10)+20, h: 50};
		//then we need to find what other components there are
		
		if(this.components.length == 0)
		{
			//if there is only a start then just place it under that
			position = {x:(this.startElement.circle.getPosition().x + this.startElement.circle.getAttrs().radius + 10),y:(this.startElement.circle.getPosition().y-(this.startElement.circle.getAttrs().radius))};
		
		
		}
		else
		{
			//as there are other elements we need t, put it next ot that
			lastShape = this.components[this.components.length-1].rect;
			position = {x:(lastShape.getPosition().x+lastShape.getSize().width/1.8),y:(lastShape.getPosition().y)}
			
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

		
	}
	


};

Kinetic.GlobalObject.extend(Kinetic.WorkFlow, Kinetic.Group);



