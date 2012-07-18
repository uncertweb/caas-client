var fontSize = 10;

Kinetic.WorkFlow = function (config)
{
	//call the super, i.e group
	Kinetic.Group.apply(this, [{draggable:config.draggable}]);
	this.vertices = new Array();
	this.classType = "WorkFlow";
	this.components = new Array();
	this.title = config.text;
	this.brokerProperties = {};
	this.brokerProperties["name"] = this.title;
	//mainElement is the box around the entire workflow. All other elements sit inside this
	this.standAlone = config.standalone;
	this.setStroke = function (colour)
	{
		this.mainElement.setStroke(colour);
	};
	this.getComponentOfIO = function(id)
	{
		return _.find(this.components, function(com){ return com.getIOObject(id) != undefined; })
	}
	this.getIOObject = function(id)
	{
		//loop through all components
		return this.getComponentOfIO(id).getIOObject(id);
	};
	this.getInputConnections = function(output)
	{
		//find all connections that have the output as the output, for each component
		var allInputsCons = new Array();
		if(output instanceof Kinetic.WorkFlow)
		{
			_.each(this.components, function(com){
				allInputsCons  = allInputsCons.concat(
					_.filter(com.ioConnections, 
						function(io){ return _.find(output.components, 
										function(comOutput)				
										{ 
											return _.isEqual(io.output.obj,comOutput);
										}) != undefined;
									})
				);
			});

		}
		else
		{
			_.each(this.components, function(com){
				allInputsCons =  allInputsCons.concat(_.filter(com.ioConnections, function(io){ return _.isEqual(io.output.obj,output);}));
			});
		}
		return allInputsCons;
	};
	this.getOutputConnections = function(input)
	{
		//find all connections that have the output as the output
		var allOutputsCons = new Array();
		if(input instanceof Kinetic.WorkFlow)
		{
			//if the input is a component then we need to check for inputs.components
			//so loop all components
			//find if one of the input.components equals the io input
			//if it does, then this is a ioConnection to return
			_.each(this.components, function(com){
				allOutputsCons  = allOutputsCons.concat(
					_.filter(com.ioConnections, 
						function(io){  
								var found = _.find(input.components, function(comInput)	{return _.isEqual(io.input.obj,comInput);}) 
								return (found != undefined);
									})
				);
			});

		}
		else
		{
			_.each(this.components, function(com){
				allOutputsCons  = allOutputsCons.concat(_.filter(com.ioConnections, function(io){ return _.isEqual(io.input.obj,input);}));
			});
		}
		return allOutputsCons;
	};
	//to get input and outputs of a workflow, need to loop components
	//this may change, dependant on if we do not include taken ones
	this.getInputs = function ()
	{
		var collectedIns = new Array();
		_.each(this.components, function(com)
		{
			collectedIns = collectedIns.concat(com.getInputs());
		});
		return collectedIns;
	};
	this.getOutputs = function ()
	{
		var collectedOuts = new Array();
		_.each(this.components, function(com)
		{
			collectedOuts = collectedOuts.concat(com.getOutputs());
		});
		return collectedOuts;
	};
	this.getLastComponentIndex = function ()
	{	
		if(this.components.length != 0)
		{
			return this.components.length - 1;
		}
	}
	this.getIndexOfElement = function (workflow)
	{
		for(iCEls=0;iCEls<this.components.length;iCEls++)
		{
			if (_.isEqual(workflow,this.components[iCEls]))
			{
				return iCEls;
			}
		}
	};
	if(this.standAlone == true)
	{
		//create the start element for the workflow
		//put it in the centre of the stage
		this.startElement = new Kinetic.WorkFlowStart({x:config.layer.getStage().getWidth()/2, y:30,text:"Start",draggable:true});
		this.add(this.startElement);
	}
	else
	{	config["type"] = "mainRect";
		config["draggable"] = true;
		this.mainElement = new Kinetic.WorkFlowElement(config);
		this.add(this.mainElement);
		//create the start element for the workflow and add it to the layer
		this.configStart = {
			x:this.mainElement.rect.getPosition().x + 20,
			y:this.mainElement.rect.getPosition().y+60,
			text:"Start"
		}
		this.startElement = new Kinetic.WorkFlowStart(this.configStart);
		this.add(this.startElement);
		//move the mainElement to the bottom, so Workflows can be seen
		this.mainElement.moveToBottom();
		
		
		//events for this work flow
		this.on("dblclick",function()
		{
			//here we want to clear the screen and just render this workflow
			config.layer.renderWorkFlow(this);
		
		});
	}
	//update the size of the element, to ensure it covers all internal elements
	this.updateSizeAndPosOfMainEl();
	if(this.standAlone == false)
	{
		this.on("dragmove", function(ev) 
		{ 
			this.updateAllVertices();
			config.layer.checkOverBin(this,ev);
		});
	}

}
Kinetic.WorkFlow.prototype = {

 	addElement : function(config)  
	{  
		
		config.text = '[' + config.brokerProperties.annotation + '] ' + config.brokerProperties.name;
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
	    	//this.startElement.connectTo(comGroup);
	    }
	    else
	    {
	    	//this.components[this.components.length -1].connectTo(comGroup);
	    }
	    
	    this.components.push(comGroup);
	    this.add(comGroup);
	    
	    
	    //need to expand the main to ensure that it covers all elements
	    this.updateSizeAndPosOfMainEl();
	    if(this.standalone==false){this.mainElement.moveToBottom();}
	    this.moveComponentsToTop();
	    
	},
	addElements : function(els)
	{
		var t = this;
		_.each(els,function(el)
		{
			//update the position of the el
			//need to reset the group position
			el.setPosition({x:0,y:0});
			ctx = t.getLayer().getContext();
			position = t.findWhereToPutNewElement(el.rect.getAttrs().width);
			t.add(el);
			t.components.push(el);
			el.setAllPositions(position);
			
			el.setAttrs({draggable:t.standAlone});
		});
		
		this.updateSizeAndPosOfMainEl();	
		
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
	setStartEl : function (flow)
	{
		this.startConfig = flow.startConfig;
		this.startElement.vertices = flow.startElement.vertices;
		var self = this;
		_.each(this.startElement.vertices,function(vert){
			if(_.isEqual(vert.start,flow.startElement))
			{
				vert.start = self.startElement;
			}
			if(_.isEqual(vert.end,flow.startElement))
			{
				vert.end = self.startElement;
			} 
		});	
	},
	connectToEl : function (el)
	{
		//need to connect this to the main element as thats the outer layer
		connection = new Kinetic.Connection({start: this, end: el, lineWidth: 1, color: "black"}); 
		this.getLayer().add(connection);
	},
	connectTo : function (connectConfig)
	{
		//this is always the output as its being connected to an input
		//need to check whether this map already exists
		//as this is a workflow, we need to check the element
		//output component
		var outputCom = this.getComponentOfIO(connectConfig.output.outputIO.id);
		//change the output from workflow to component
		connectConfig.output.obj = outputCom;
		var foundCon  = _.find(outputCom.ioConnections,function(ioCon)
						{
							return _.isEqual(ioCon,connectConfig);
						});
		if (foundCon != undefined)
		{
			//this connection has already been defined
			return false;
		}
		else
		{
			//this is not a current connection
			//so we need to save it in the list
			outputCom.ioConnections.push(connectConfig);
			if(connectConfig.input.obj instanceof Kinetic.WorkFlow)
			{
				var oldInput = connectConfig.input.obj;
				var inputCom = connectConfig.input.obj.getComponentOfIO(connectConfig.input.inputIO.id);
				connectConfig.input.obj = inputCom;
				inputCom.ioConnections.push(connectConfig);
				connectConfig.input.obj = oldInput;
			}
			else
			{
				connectConfig.input.obj.ioConnections.push(connectConfig);
			}
			
			
			//check whether we should draw a connection, ie whether the connection has not already been drawn
			var that = this;
			foundCon = _.find(this.vertices, function(vert)
						{
							return vert.start == that && vert.end == connectConfig.input.obj;
						});
			if(foundCon == undefined)
			{
				//no connection, so create one
				connection = new Kinetic.Connection({start: this, end: connectConfig.input.obj, lineWidth: 1, color: "black"}); 
				this.getLayer().add(connection);
				this.getLayer().draw();
			}
			return true;
		}
	},
	disconnect :function(connectConfig)
	{
		//this is always the output
		//delete from IO connections
		//output component
		var outputCom = this.getComponentOfIO(connectConfig.output.outputIO.id);
		//change the output from workflow to component
		connectConfig.output.obj = outputCom;
		connectConfig.output.obj.ioConnections.splice(_.indexOf(this.ioConnections, connectConfig),1);
		if(connectConfig.input.obj instanceof Kinetic.WorkFlow)
		{
			//get the component of the ioObject, then use this to delete its ioConection
			var comToDelete = connectConfig.input.obj.getComponentOfIO(connectConfig.input.inputIO.id);
			comToDelete.ioConnections.splice(_.indexOf(comToDelete.ioConnections, connectConfig),1);
		}
		else
		{
			connectConfig.input.obj.ioConnections.splice(_.indexOf(connectConfig.input.obj.ioConnections, connectConfig),1);
		}
		//may need to change the input obj, as it needs to be an element
		if(connectConfig.input.obj instanceof Kinetic.WorkFlow)
		{
			var inputCom = connectConfig.input.obj.getComponentOfIO(connectConfig.input.inputIO.id);
				
		}
		else
		{
			var inputCom = connectConfig.input.obj;
		}
		//delete from vertices, if this is the last ioconnection for this and input
		var foundCon  = _.find(connectConfig.output.obj.ioConnections,function(ioCon)
						{
							return _.isEqual(ioCon.input.obj,inputCom) && _.isEqual(ioCon.output.obj,connectConfig.output.obj);
						});
		//if its undefined that means there should not be a connection
		if (foundCon == undefined)
		{
			//need to delete
			//find the connection in vertices
			var that = this;
			foundCon = _.find(this.vertices, function(vert)
						{
							return vert.start == that && vert.end == connectConfig.input.obj;
						});
			foundCon.remove();
			this.getLayer().draw();
			
		}
		
	},
	deleteElement : function(el)
	{
		//if the argument is a number then it is the index of a component which should be rendered
		el = _.isNumber(el) ? this.components[el] : el;
		el.deleteAllIOs();
		//remove the element from the currentElements
		this.components.splice(this.getIndexOfElement(el), 1);
		this.remove(el);
	},
	deleteAllIOs : function ()
	{
		//call deleteAllIOs for all components
		_.each(this.components,function(com)
		{
			com.deleteAllIOs();
		});
		//delete all vertices that are for ordering
		this.disconnectAllVertices();
	},
	connectAllIOs : function()
	{
		
	},
	disconnectAllVertices : function ()
	{
		var deleteVerts = this.vertices.slice();
		//remove all the vertices for this workflow
		_.each(deleteVerts,function(vert)
		{
			vert.remove();
		});
		//disconnect the vertices of all components
		_.each(this.components,function(el)
		{
			el.disconnectAllVertices();
		});
	},
	addConnectionsToLayer : function ()
	{
		
		if(this.standAlone == false)
		{
			for(Vi=0;Vi<this.vertices.length;Vi++) { this.getLayer().add(this.vertices[Vi]); }
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
	setOrderedVertices : function ()
	{
		if(this.components.length != 0)
		{
			this.startElement.connectToEl(this.components[0]);
		}
		//loop all elements
		for(var elI = 0; elI < this.components.length; elI++)
		{
			//if not the last element, then join to the next elements
			if(elI != this.components.length -1)
			{
				this.components[elI].connectToEl(this.components[elI+1]);
			}
		}
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
				position = {x:(this.startElement.circle.getPosition().x-(width/2)),y:(this.startElement.circle.getPosition().y+(this.startElement.circle.getAttrs().radius.x + 30))};
			
			}
			else
			{
				//as there are other elements we need t, put it next ot that
				lastShape = this.components[this.components.length-1].rect;				
				xPos = ((lastShape.getPosition().x + (lastShape.getWidth()/2)) - width/2)
				position = {x:xPos,y:(lastShape.getPosition().y + lastShape.getAttrs().height+40)}
				
			}
		}
		else
		{
			if(this.components.length == 0)
			{
				//if there is only a start then just place it under that
				position = {x:(this.startElement.circle.getPosition().x+this.startElement.circle.getAttrs().radius.x+20),y:(this.startElement.circle.getPosition().y-30)};
			
			
			}
			else
			{
				//as there are other elements we need t, put it next ot that
				lastShape = this.components[this.components.length-1].rect;
				position = {x:(lastShape.getPosition().x+lastShape.getAttrs().width +20),y:(lastShape.getPosition().y)}
				
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
			x = this.startElement.circle.getAbsolutePosition().x;
			rad = this.startElement.circle.getAttrs().radius;
			smallestX = (this.startElement.circle.getAbsolutePosition().x-this.startElement.circle.getAttrs().radius.x)
			
			smallestY = (this.startElement.circle.getAbsolutePosition().y-this.startElement.circle.getAttrs().radius.x)
		
			biggestX = (this.startElement.circle.getAbsolutePosition().x+this.startElement.circle.getAttrs().radius.x)
		
			biggestY = (this.startElement.circle.getAbsolutePosition().y+this.startElement.circle.getAttrs().radius.x)
			
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
		if(smallestX>(this.startElement.circle.getAbsolutePosition().x-this.startElement.circle.getAttrs().radius.x))
		{
			smallestX = (this.startElement.circle.getAbsolutePosition().x-this.startElement.circle.getAttrs().radius.x)
		}
		if(smallestY>(this.startElement.circle.getAbsolutePosition().y-this.startElement.circle.getAttrs().radius.x))
		{
			smallestY = (this.startElement.circle.getAbsolutePosition().y-this.startElement.circle.getAttrs().radius.x)
		}
		if(biggestX<(this.startElement.circle.getAbsolutePosition().y+this.startElement.circle.getAttrs().radius.x))
		{
			biggestX = (this.startElement.circle.getAbsolutePosition().x+this.startElement.circle.getAttrs().radius.x)
		}
		if(biggestY<(this.startElement.circle.getAbsolutePosition().y+this.startElement.circle.getAttrs().radius.x))
		{
			biggestY = (this.startElement.circle.getAbsolutePosition().y+this.startElement.circle.getAttrs().radius.x)
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



