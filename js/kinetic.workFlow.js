var fontSize = 10;

Kinetic.WorkFlow = function (config)
{
	//call the super
	Kinetic.WorkFlowElement.apply(this, [{draggable:config.draggable,brokerProperties:config.brokerProperties}]);
	//variables
	this.title = config.text;
	this.classType = "WorkFlow";
	this.components = [];
	this.endElement = {};
	//mainElement is the box around the entire workflow. All other elements sit inside this
	this.type = config.type;
	this.config = {};
	
	this.getTitle = function()
	{
		if(this.brokerProperties.title == "")
		{
			return "Main Workflow";	
		}
		else
		{
			return '[' + this.brokerProperties.iterations + '] ' + this.brokerProperties.title;	
		}
	};
	/*
		Getter and Setter Methods
	*/
	this.getWorkFlows = function (noIOs)
	{
		var workflows = [];
		_.each(this.children,function(child)
		{
			if(child instanceof Kinetic.WorkFlow)
			{
				if(noIOs)
				{
					if(_.isEmpty(child.getInputs()) || _.isEmpty(child.getOutputs()))
					{
						workflows.push(child);
					}
				}
				else
				{
					workflows.push(child);
				}
			}
			
		});
		if(_.isEmpty(this.getInputs()) || _.isEmpty(this.getOutputs()))
		{
			workflows.push(this);
		}
		
		return workflows;
	};
	this.setType = function(val)
	{
		this.standAlone = val;	
		this.type = val;
		this.updateType();
	};
	this.setStroke = function (colour)
	{
		this.mainElement.setStroke(colour);
	};
	this.updateComponentOrder = function(order)
	{
		var newOrder = [];
		var self = this;
		_.each(order,function(comId)
		{
			var next = _.find(self.components, function(com)
			{
				return com._id == comId;
			});
			
			newOrder.push(next);
		});
		
		this.components = newOrder;
		//update order of chilren
		var childrenOrder = newOrder.slice();
		childrenOrder.unshift(this.startElement);
		childrenOrder.push(this.endElement);
		this.children = childrenOrder;
		
	};
	this.getLastComponentIndex = function ()
	{	
		if(this.components.length != 0)
		{
			return this.components.length - 1;
		}
	}
	this.getIndexOfObject = function (array,object)
	{
		for(iCEls=0;iCEls<array.length;iCEls++)
		{
			if (_.isEqual(object,array[iCEls]))
			{
				return iCEls;
			}
		}
	};
	this.addInput = function (newI)
	{
		var check = _.find(this.brokerProperties.inputs,function(i){return _.isEqual(i,newI)});
		if(check == undefined)
		{
			this.brokerProperties.inputs.push(newI);
			this.updateVerticesOrders();
			return true;
		}
		else
		{
			return false;
		}
	};
	this.addOutput = function (newO)
	{
		var check = _.find(this.brokerProperties.outputs,function(o){return _.isEqual(o,newO)});
		if(check == undefined)
		{
			this.brokerProperties.outputs.push(newO);
			this.updateVerticesOrders();
			return true;
		}
		else
		{
			return false;
		}
		
	};
	this.deleteOutput = function (io)
	{
		//find all ioconnections that relate to this output	
		var toDelete = _.filter(this.ioConnections,function(ioCon){
			return _.isEqual(ioCon.input.inputIO,io) || _.isEqual(ioCon.output.outputIO,io)
		});
		_.each(toDelete,function(del)
		{	
			del.output.obj.disconnect(del);
		});
		this.brokerProperties.outputs.splice(this.getIndexOfObject(this.brokerProperties.outputs,io),1);
		this.updateVerticesOrders();
	};
	this.deleteInput = function (io)
	{
		//find all ioconnections that relate to this input	
		var toDelete = _.filter(this.ioConnections,function(ioCon){
			return _.isEqual(ioCon.input.inputIO,io) || _.isEqual(ioCon.output.outputIO,io)
		});
		_.each(toDelete,function(del)
		{	
			del.output.obj.disconnect(del);
		});
		this.brokerProperties.inputs.splice(this.getIndexOfObject(this.brokerProperties.inputs,io),1);
		this.updateVerticesOrders();
	};
	//for removing IO if element that comes from is deleted
	this.removeIO = function(el)
	{
		var ins = this.getInputs().slice();
		var outs = this.getOutputs().slice();
		var self = this;
		//inputs first
		_.each(ins, function(i)
		{
			if(_.isEqual(el,i.com))
			{
				self.deleteInput(i);
			}
		});
		_.each(outs, function(out)
		{
			if(_.isEqual(el,out.com))
			{
				self.deleteOutput(out);
			}
		});

	};
	
	/*
		Workflow Init
	*/
	if(this.type == Kinetic.WorkFlowType.standAlone || this.type == Kinetic.WorkFlowType.main)
	{
		//create the start element for the workflow
		//put it in the centre of the stage
		this.startElement = new Kinetic.WorkFlowStart({x:30, y:30,text:"Start",draggable:true});
		this.add(this.startElement);
		this.brokerProperties["iterations"] = 1;
	}
	else
	{	config["type"] = "mainRect";
		config["draggable"] = true;
		this.mainElement = new Kinetic.WorkFlowComponent(config);
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
	this.config = config;
	//update the size of the element, to ensure it covers all internal elements
	this.updateSizeAndPosOfMainEl();
	/* 
		Set up events for workflow
	*/
	if(this.type == Kinetic.WorkFlowType.nested)
	{
		this.on("dragmove", function(ev) 
		{ 
			this.updateAllVertices();
		});
		this.on("dragend", function(ev) { 
    		config.layer.checkOverBin(this,ev);
    	});
    	this.on("click", function(ev) { 
    		WorkFlow_UI.toolbox.displayObject(this);
    	});
	}
	
}
Kinetic.WorkFlow.prototype = {
	updateType : function()
	{
		if(this.type == Kinetic.WorkFlowType.standAlone)
		{
			//set the elements up to be dragged etc
			if(this.mainElement != undefined)
			{
				this.getLayer().remove(this.mainElement);
				this.remove(this.mainElement);
				this.mainElement = null;
			}
			this.setDraggable(false);
			this.off("dragend dragmove dblclick click");
			this.startElement.setDraggable(true);
		}
		else if (this.type == Kinetic.WorkFlowType.nested)
		{
			if(this.mainElement == null)
			{
				this.config["type"] = "mainRect";
				this.config["draggable"] = true;
				this.mainElement = new Kinetic.WorkFlowComponent(this.config);
				this.setAllAttrs({draggable:false});
				this.setDraggable(true);
				this.add(this.mainElement);
				this.mainElement.moveToBottom();
				this.on("dblclick",function()
				{
					//here we want to clear the screen and just render this workflow
					this.config.layer.renderWorkFlow(this);
				
				});
				this.on("dragmove", function(ev) 
				{ 
					this.updateAllVertices();
				});
				this.on("dragend", function(ev) { 
		    		config.layer.checkOverBin(this,ev);
		    	});
			}
		}
		this.reDraw();
	},
	reDraw : function()
	{
		if(this.type == Kinetic.WorkFlowType.standAlone)
		{
			this.setPosition({x:0,y:0});
			this.startElement.setAllPositions({x:this.getLayer().getStage().getWidth()/2, y:30});
			var self = this;
			//reDraw components in vertical order
			var comArray = [];
			_.each(this.components,function(com)
			{
				com.setAllPositions(self.findWhereToPutNewElement(com.getWidth(),comArray));
				comArray.push(com);
				com.setDraggable(true);
			})
			if(this.endElement != null)
			{
				//this.getLayer().remove(this.endElement);
				this.remove(this.endElement)
				this.endElement = null;
			}
	 		
		    this.endElement = this.createEndElement();
		    this.add(this.endElement);
		    			
		}
		else
		{
			//nested or main then we will layout from side to side
			var elementArray = this.children;
			
			//width of the current element
			var currentWidth = 0;
			//current width of the row, ie elements that will be in it
			var rowWidth = 0;
			//row to be rendered, when it is correct width
			var rowArray = [];
			//Y position of the last row, rows start at 50
			var lastYRow = 30;
			var maxWidth = this.type == Kinetic.WorkFlowType.nested ? (this.getComWidth() + (this.children.length * 30)) : (this.getStage().getWidth()-40);
			maxWidth = maxWidth > (this.getStage().getWidth()-40) ? (this.getStage().getWidth()-100) : maxWidth;
			nextRowY = 0;
			//number of rows rendered
			var noRows = 0;
			var margin = this.type == Kinetic.WorkFlowType.nested ? (this.children.length - 1) * 30 : this.children.length * 30;
			for(iCEls=0;iCEls<elementArray.length;iCEls++)
			{
			
				if(this.type == Kinetic.WorkFlowType.nested)
				{
					if(_.isEqual(elementArray[iCEls],this.mainElement))
					{
						elementArray[iCEls].setAllPositions({x:0,y:0});
						continue;
					} 
				}
				elementArray[iCEls].setAllPositions({x:0,y:0});
				currentWidth = elementArray[iCEls].getWidth();
					
				//check if adding this current width will overflow the canvas
				if((rowWidth+currentWidth+margin)>maxWidth)
				{
					//row needs to be rendered
					noRows++;
					//render the row
					nextRowY = this.renderRow(noRows,rowArray,lastYRow,rowWidth,maxWidth);
					//incease position of last row
					lastYRow = nextRowY+20;
					//clear the row array
					rowArray = [];
					rowWidth = 0;
					//add current element to rowArray, for the next row
					rowArray.push(elementArray[iCEls]);
					rowWidth +=currentWidth;
					
				}
				else
				{
					//add this element to the row array
					rowArray.push(elementArray[iCEls]);
					rowWidth +=currentWidth;
				}
			}
			//output the last row, that was not exectuted during the loop
			noRows++;
			this.renderRow(noRows,rowArray,lastYRow,rowWidth,maxWidth);
			this.draw();
		}	
		this.updateSizeAndPosOfMainEl();
		this.updateVerticesOrders()

	},
	/*
		Delete all IOs and call on all components to deletes there IOs
	*/
	deleteAllIOs : function ()
	{
		//loop through all the ioConnections
		//call disconnect on the ouput	
		_.each(this.ioConnections,function(io)
		{
			io.output.obj.disconnect(io);
		});
		_.each(this.components,function(com)
		{
			com.deleteAllIOs();
		});
		//delete vertices that are for ordering
		this.disconnectAllVertices();

	},
	/*
		Connects all IOs already set, if workflow is standalone then will not connect workflow IOs
	*/
	connectAllIOs : function()
	{
		if(this.type != Kinetic.WorkFlowType.standAlone)
		{
			_.each(this.ioConnections,function(io)
			{
				io.output.obj.connectTo(io);
			});
		}
		_.each(this.children,function(com)
		{
			com.connectAllIOs();
		});	
	},
	/*
		Determines whether to render a backwards or forwards row, based on noRows.
	*/
	renderRow : function(noRows,rowArray,lastYRow,rowWidth,maxWidth)
	{
		if (noRows%2 == 0)
		{
			return this.setUpBackwardsRow(rowArray,lastYRow,rowWidth,maxWidth);
		}
		else
		{
			return this.setUpForwardsRow(rowArray,lastYRow,rowWidth,maxWidth);
		}	
	},
	/*
		Sets the x,y positions of the rowArray elements. Goes from left to right
		
		Arguments:
			rowArray = array of workflow elements
			lastYRow = Y position of last row
			rowWidth = width of all components in rowArray
			maxWidth = maximum width that canvas can take
	*/
	setUpForwardsRow : function(rowArray,lastYRow,rowWidth,maxWidth)
	{
		//the X value to write to next
		var currentX = 40;
		var self = this;
		var ys = this.findYPosForRow(rowArray);
		var minY = _.min(_.values(ys));
		lastYRow += Math.abs(minY);
		var nextYRow = 0;
		margin = (maxWidth-rowWidth)/rowArray.length;
		_.each(rowArray,function(rowEl)
		{
			//find the margin between elements
			var xAdd = rowEl instanceof Kinetic.WorkFlowEnd ? rowEl.getWidth()/2:0;
			rowEl.setAllPositions({x:currentX + xAdd,y:lastYRow+ys[rowEl._id]});
			if(nextRowY<rowEl.getHeight()+lastYRow)
			{
				nextRowY = rowEl.getHeight()+lastYRow;
			}
			currentX += margin;
			var widthAdd = rowEl instanceof Kinetic.WorkFlowStart ? rowEl.getWidth()/2:rowEl.getWidth();
			currentX += widthAdd;
		})
		return nextRowY;
	},
	/*
		Sets the x,y positions of the rowArray elements. Goes from right to left
		
		Arguments:
			rowArray = array of workflow elements
			lastYRow = Y position of last row
			rowWidth = width of all components in rowArray
			maxWidth = maximum width that canvas can take
	*/
	setUpBackwardsRow : function(rowArray,lastYRow,rowWidth,maxWidth)
	{
		//the X value to write to next
		var currentX = maxWidth ;;
		var self = this;
		var ys = this.findYPosForRow(rowArray);
		var minY = _.min(_.values(ys));
		lastYRow += Math.abs(minY);
		margin = (maxWidth-rowWidth)/rowArray.length;
		_.each(rowArray,function(rowEl)
		{
			//find the margin
			var xAdd = rowEl instanceof Kinetic.WorkFlowEnd ? rowEl.getWidth()/2:0;
			rowEl.setAllPositions({x:currentX- (rowEl.getWidth()+xAdd),y:lastYRow+ys[rowEl._id]});
			if(nextRowY<rowEl.getHeight()+lastYRow)
			{
				nextRowY = rowEl.getHeight()+lastYRow;
			}
			currentX -= margin;
			currentX -= rowEl.getWidth();
	
		});
		return nextRowY;
	},
	/*
		Finds the y position for the next row, based on the height of the components past to the function.
		
		Argument: rowArray = array of workflow elements
	*/
	findYPosForRow : function(rowArray)
	{
		var last = null;
		var ys = {};
		_.each(rowArray, function(rowEl)
		{
			if(last == null)
			{
				ys[rowEl._id] = 0;
			}
			else
			{
				ys[rowEl._id] = (ys[last._id] + last.getHeight()/2) - rowEl.getHeight()/2;
			}
			last = rowEl;
		});
		return ys;
	},
	/*
		Create end element, either create a new one or based on the argument passed
		
		Arguments: currentEl = end element
	*/
	createEndElement : function(currentEl)
	{
		if(_.isEmpty(currentEl))
		{
			var position = this.findWhereToPutNewElement(15,this.components);
			position.x = position.x + 7.5;
		}
		else
		{
			var position = currentEl.circle.getPosition();
		}
		//need to create the element after the last element
		
		if(position.lastShape == undefined)
		{
			return new Kinetic.WorkFlowEnd({x:position.x, y:position.y,text:"End",draggable:true});
		}
		else
		{
			return new Kinetic.WorkFlowEnd({x:position.x, y:position.y + position.lastShape.getHeight()/2,text:"End",draggable:true});
		}
	},
	/*
		Add elements to the workflow.
		
		Argument: els is an array or new components
	*/
	addElements : function(els)
	{
		var draggable =  this.type == Kinetic.nested ? false : true;
		var self = this;
		_.each(els,function(el)
		{
			//update the position of the el
			//need to reset the group position
			el.setPosition({x:0,y:0});
			self.add(el);
			self.components.push(el);
			el.setAttrs({draggable:draggable});
		});
		//create end element if its not currently created
		if(_.isEmpty(this.endElement)==false){this.remove(this.endElement);}
		this.endElement = this.createEndElement(this.endElement)
		this.add(this.endElement);
		
	    if(this.type == Kinetic.WorkFlowType.nested)
	    {
	    	this.reDraw();
	    }
	    this.updateVerticesOrders();
		this.updateSizeAndPosOfMainEl();
		return this.components.length -1;
	},
	/*
		Update vertices when component is dragged, calls _dragUpdate on each vertice.
	*/
	updateAllVertices : function ()
	{
		//updates vertices when components are dragged
		if(this.type == Kinetic.WorkFlowType.nested)
		{
			this.mainElement.updateAllVertices();
			for(Vi=0;Vi<this.vertices.length;Vi++) { this.vertices[Vi]._dragUpdate(); }
		}
		for(Ci=0;Ci<this.components.length;Ci++) { this.components[Ci].updateAllVertices(); }
		this.startElement.updateAllVertices();
	},
	/*
		Updates vertice orders.
		
		Does this by doing them and reconnecting all the IOs
	*/
	updateVerticesOrders : function()
	{
		this.disconnectAllVertices();
	    //this.setOrderedVertices();
	    this.connectAllIOs();
	},
	/*
		Delete component within workflow
		
		Argument is either an index for teh components array or a component to delete.
	*/
	deleteElement : function(el)
	{
		//if the argument is a number then it is the index of a component which should be rendered
		el = _.isNumber(el) ? this.components[el] : el;
		el.deleteAllIOs();
		this.removeIO(el);
		//remove the element from the currentElements
		this.components.splice(this.getIndexOfObject(this.components,el), 1);
		this.remove(el);
	},
	/*
		Remove all vertices for this workflow and internal components
	*/
	disconnectAllVertices : function ()
	{
		var deleteVerts = this.vertices.slice();
		//remove all the vertices for this workflow
		_.each(deleteVerts,function(vert)
		{
			vert.remove();
		});
		//disconnect the vertices of all components
		_.each(this.children,function(el)
		{
			el.disconnectAllVertices();
		});
	},
	/*
		Connects all elements based the component order.
	*/
	setOrderedVertices : function ()
	{
		//loop all elements
		for(var elI = 0; elI < this.components.length; elI++)
		{
			//if not the last element, then join to the next elements
			if(elI != this.components.length -1)
			{
				this.components[elI].connectToEl(this.components[elI+1]);
			}
			if(this.components[elI] instanceof Kinetic.WorkFlow)
			{
				this.components[elI].setOrderedVertices();
			}
		}
		if(this.components.length != 0)
		{
			this.startElement.connectToEl(this.components[0]);
			this.components[this.components.length - 1].connectToEl(this.endElement);
		}
	},
	/*
		Set up or remove click events for IO Mode, so a stroke can be set.
		
		Arguments: ioMode boolean. True for setting up, False for turning off
	*/
	setIOMode : function(ioMode)
	{	
		//set up click events for ioMode
		if(ioMode)
		{
			for(iCEls=0;iCEls<this.children.length;iCEls++)
			{
				this.children[iCEls].on('click',function()
				{
					if(this.getLayer().setIoObjects(this))
					{
						this.setStroke('red');
						this.getLayer().draw();
					}
					else
					{
						this.setStroke('black');
						this.getLayer().draw();
					}
					
				});
			}
		}
		else
		{
			for(iCEls=0;iCEls<this.children.length;iCEls++)
			{
				this.children[iCEls].off('click');
				this.children[iCEls].on("click", function(ev) { 
					WorkFlow_UI.toolbox.displayObject(this);
				});
				this.children[iCEls].setStroke('black');
			}
		}
		
	},
	/*
		Update size and position based on internal components.
		Also ensures text for nested workflow is centered.
	*/
	updateSizeAndPosOfMainEl : function()
	{
		//if standalone, then do not need to update the size
		if(this.type != Kinetic.WorkFlowType.nested) { return;}
		//updates the size to ensure that all components in the workflow are covered, by the rect in the background
		this.mainElement.rect.setSize(this.updateSizeOfMainElement().w,this.updateSizeOfMainElement().h);
	    this.mainElement.rect.setPosition(this.updateSizeOfMainElement().x,this.updateSizeOfMainElement().y);
	    xText = this.mainElement.rect.getPosition().x + (this.mainElement.textLength/2 + (this.mainElement.textLength/fontSize));
	    this.mainElement.text.setPosition({x:xText,y:this.mainElement.rect.getPosition().y+10});
	    //ensure the group as a whole is not overlapping, if it is then it needs to be moved
	    
	},
	/*
		Move internal components above nested workflow rectangle, so components can be seen.
	*/
	moveComponentsToTop : function()
	{
		for(i=0;i<this.components.length;i++) 
		{ 
			this.components[i].moveToTop(); 
		}
	},
	/*
		Finds where the next element should go, used for autolayout and laying out components within a nested workflow.
	*/
	findWhereToPutNewElement : function(width,comArray)
	{
		//first we need to find the size of the new element
		if(this.type == Kinetic.WorkFlowType.standAlone)
		{
			//we want to align elements under each other
			if(comArray.length == 0)
			{
				//if there is only a start then just place it under that
				position = {x:(this.startElement.circle.getPosition().x-(width/2)),y:(this.startElement.circle.getPosition().y+(this.startElement.circle.getAttrs().radius.x + 30))};
			}
			else
			{
				//as there are other elements we need t, put it next ot that
				var lastShape = comArray[comArray.length-1];	
				var pos = lastShape.getPositionOfElement();			
				var xPos = ((lastShape.getPositionOfElement().x + (lastShape.getWidth()/2)) - width/2)
				var position = {x:xPos,y:(lastShape.getPositionOfElement().y + lastShape.getHeight()+40),lastShape:lastShape}
			}
		}
		else
		{
			if(comArray.length == 0)
			{
				//if there is only a start then just place it under that
				var position = {x:(this.startElement.circle.getPosition().x+this.startElement.circle.getAttrs().radius.x+30),y:(this.startElement.circle.getPosition().y-30)};
			}
			else
			{
				//as there are other elements we need t, put it next ot that
				var lastShape = comArray[comArray.length-1];
				var pos = lastShape.getPositionOfElement();		
				var position = {x:(lastShape.getPositionOfElement().x+lastShape.getWidth() +30),y:(lastShape.getPositionOfElement().y),lastShape:lastShape}
				
			}
		}
		return position;
	},
	/*
		Workout the size of the outside rectangle based on the components.
		Returns the width and height to change the rectangle too, and x and y coordinates
	*/
	updateSizeOfMainElement : function()
	{
		smallestX = -1;
		biggestX = -1;
		biggestY = -1;
		smallestY = -1;
			 
		_.each(this.children, function(child){
		
			var pos = child.getPositionOfElement();
			if(pos.x < smallestX)
			{
				smallestX = pos.x;
			}
			if(pos.y < smallestY)
			{
				smallestY = pos.y;
			}
			if((pos.x + child.getWidth()) > biggestX)
			{
				biggestX = (pos.x + child.getWidth());
			}
			if((pos.y + child.getHeight()) > biggestY)
			{
				biggestY = (pos.y + child.getHeight());
			}
			
		});
		
		if((this.mainElement.textLength)+20>(biggestX-smallestX))
		{
			return {w:((this.mainElement.textLength)+10),h:(biggestY-smallestY)+15,x:smallestX,y:smallestY-5};
		}
		else
		{
			return {w:(biggestX-smallestX)+10,h:(biggestY-smallestY)+15,x:smallestX,y:smallestY-5};
		}

		
	},
	/*
		Set all positions within the nested workflow, relative to the top left of the 
		workflow.
	*/
	setAllPositions : function (config)
	{
		this.setPosition({x:0,y:0});
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
		offset.y = this.endElement.circle.getPosition().y - mainPos.y;
		offset.x = this.endElement.circle.getPosition().x - mainPos.x;
		this.endElement.setAllPositions({x:config.x+offset.x,y:config.y+offset.y});
		this.mainElement.setAllPositions({x:config.x,y:config.y});
	},	
	getHeight : function ()
	{
		return this.mainElement.getHeight();
	},
	getWidth : function()
	{
		return this.mainElement.getWidth();
	},
	getComWidth : function()
	{	
		var width = 0;
		var self = this;
		_.each(this.children,function(child){
			if(_.isEqual(self.mainElement,child) != true)
			{
				width += child.getWidth();
			}
			
		});
		return width;
	},
	publish : function()
	{
		//create workflow for this workflow
		
		var currentWF = new UncertWeb.Workflow(this.brokerProperties)
		_.each(this.components,function(com)
		{
			currentWF.append(com.publish());
		});
		//return ioConnections in second element of the array
		return currentWF;
	}

};

Kinetic.GlobalObject.extend(Kinetic.WorkFlow, Kinetic.WorkFlowElement);



