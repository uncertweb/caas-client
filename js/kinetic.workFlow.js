var fontSize = 10;

Kinetic.WorkFlow = function (config)
{
	//call the super, i.e group
	this.title = config.text;
	Kinetic.WorkFlowElement.apply(this, [{draggable:config.draggable,brokerProperties:config.brokerProperties}]);
	this.classType = "WorkFlow";
	this.components = [];
	this.endElement = {};
	//mainElement is the box around the entire workflow. All other elements sit inside this
	this.type = config.type;
	this.config = {};
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
		if(val == Kinetic.WorkFlowType.standAlone)
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
		else if (val == Kinetic.WorkFlowType.nested)
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
	if(this.type == Kinetic.WorkFlowType.standAlone || this.type == Kinetic.WorkFlowType.main)
	{
		//create the start element for the workflow
		//put it in the centre of the stage
		this.startElement = new Kinetic.WorkFlowStart({x:30, y:30,text:"Start",draggable:true});
		this.add(this.startElement);
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
	this.brokerProperties["iterations"] = 1;
}
Kinetic.WorkFlow.prototype = {
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
	createEndElement : function()
	{
		//need to create the element after the last element
		var position = this.findWhereToPutNewElement(15,this.components);
		if(position.lastShape == undefined)
		{
			return new Kinetic.WorkFlowEnd({x:position.x+7.5, y:position.y,text:"End",draggable:true});
		}
		else
		{
			return new Kinetic.WorkFlowEnd({x:position.x+7.5, y:position.y + position.lastShape.getHeight()/2,text:"End",draggable:true});
		}
	},
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
		//renew the endElement
		//if its already created, then do not remove it
		if(this.endElement != null)
		{
			//this.getLayer().remove(this.endElement);
			this.remove(this.endElement)
			this.endElement = null;
		}
 		
	    this.endElement = this.createEndElement()
	    this.add(this.endElement);
	    if(this.type == Kinetic.WorkFlowType.nested)
	    {
	    	this.reDraw();
	    }
	    this.updateVerticesOrders();
		this.updateSizeAndPosOfMainEl();
		return this.components.length -1;
	},
	updateAllVertices : function ()
	{
		if(this.type == Kinetic.WorkFlowType.nested)
		{
			this.mainElement.updateAllVertices();
			for(Vi=0;Vi<this.vertices.length;Vi++) { this.vertices[Vi]._dragUpdate(); }
		}
		for(Ci=0;Ci<this.components.length;Ci++) { this.components[Ci].updateAllVertices(); }
		this.startElement.updateAllVertices();
	},
	updateVerticesOrders : function()
	{
		 this.disconnectAllVertices();
	    //this.setOrderedVertices();
	    this.connectAllIOs();
	},
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
	setIOMode : function(ioMode)
	{	
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
	moveComponentsToTop : function()
	{
		for(i=0;i<this.components.length;i++) 
		{ 
			this.components[i].moveToTop(); 
		}
	},
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
	updateSizeOfMainElement : function()
	{
		smallestX = -1;
		biggestX = -1;
		biggestY = -1;
		smallestX = -1;
		if(this.components.length == 0)
		{
			var x = this.startElement.circle.getAbsolutePosition().x;
			var rad = this.startElement.circle.getAttrs().radius;
			smallestX = (this.startElement.circle.getAbsolutePosition().x-this.startElement.circle.getAttrs().radius.x)
			
			smallestY = (this.startElement.circle.getAbsolutePosition().y-this.startElement.circle.getAttrs().radius.x)
		
			biggestX = (this.startElement.circle.getAbsolutePosition().x+this.startElement.circle.getAttrs().radius.x)
		
			biggestY = (this.startElement.circle.getAbsolutePosition().y+this.startElement.circle.getAttrs().radius.x)
			if(!(_.isEmpty(this.endElement)))
			{
				if(smallestX>(this.endElement.circle.getAbsolutePosition().x-this.endElement.circle.getAttrs().radius.x))
				{
					smallestX = (this.endElement.circle.getAbsolutePosition().x-this.endElement.circle.getAttrs().radius.x)
				}
				if(smallestY>(this.endElement.circle.getAbsolutePosition().y-this.endElement.circle.getAttrs().radius.x))
				{
					smallestY = (this.endElement.circle.getAbsolutePosition().y-this.endElement.circle.getAttrs().radius.x)
				}
				if(biggestX<(this.endElement.circle.getAbsolutePosition().x+this.endElement.circle.getAttrs().radius.x))
				{
					biggestX = (this.endElement.circle.getAbsolutePosition().x+this.endElement.circle.getAttrs().radius.x)
				}
				if(biggestY<(this.endElement.circle.getAbsolutePosition().y+this.endElement.circle.getAttrs().radius.x))
				{
					biggestY = (this.endElement.circle.getAbsolutePosition().y+this.endElement.circle.getAttrs().radius.x)
				}
			}
			if((this.mainElement.textLength)+20>(biggestX-smallestX))
			{
				return {w:((this.mainElement.textLength)+20),h:(biggestY-smallestY)+50,x:smallestX-15,y:smallestY-30};
			}
			else
			{
				return {w:(biggestX-smallestX)+40,h:(biggestY-smallestY)+50,x:smallestX-15,y:smallestY-30};
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
		if(biggestX<(this.startElement.circle.getAbsolutePosition().x+this.startElement.circle.getAttrs().radius.x))
		{
			biggestX = (this.startElement.circle.getAbsolutePosition().x+this.startElement.circle.getAttrs().radius.x)
		}
		if(biggestY<(this.startElement.circle.getAbsolutePosition().y+this.startElement.circle.getAttrs().radius.x))
		{
			biggestY = (this.startElement.circle.getAbsolutePosition().y+this.startElement.circle.getAttrs().radius.x)
		}
		//check the endElement to see if that contains the smallest or biggest of x and y
		if(!(_.isEmpty(this.endElement)))
		{
			if(smallestX>(this.endElement.circle.getAbsolutePosition().x-this.endElement.circle.getAttrs().radius.x))
			{
				smallestX = (this.endElement.circle.getAbsolutePosition().x-this.endElement.circle.getAttrs().radius.x)
			}
			if(smallestY>(this.endElement.circle.getAbsolutePosition().y-this.endElement.circle.getAttrs().radius.x))
			{
				smallestY = (this.endElement.circle.getAbsolutePosition().y-this.endElement.circle.getAttrs().radius.x)
			}
			if(biggestX<(this.endElement.circle.getAbsolutePosition().x+this.endElement.circle.getAttrs().radius.x))
			{
				biggestX = (this.endElement.circle.getAbsolutePosition().x+this.endElement.circle.getAttrs().radius.x)
			}
			if(biggestY<(this.endElement.circle.getAbsolutePosition().y+this.endElement.circle.getAttrs().radius.x))
			{
				biggestY = (this.endElement.circle.getAbsolutePosition().y+this.endElement.circle.getAttrs().radius.x)
			}
		}
		if((this.mainElement.textLength)+20>(biggestX-smallestX))
		{
			return {w:((this.mainElement.textLength)+40),h:(biggestY-smallestY)+50,x:smallestX-15,y:smallestY-30};
		}
		else
		{
			return {w:(biggestX-smallestX)+40,h:(biggestY-smallestY)+50,x:smallestX-15,y:smallestY-30};
		}

		
	},
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
	}

};

Kinetic.GlobalObject.extend(Kinetic.WorkFlow, Kinetic.WorkFlowElement);



