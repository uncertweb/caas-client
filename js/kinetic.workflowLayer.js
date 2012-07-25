Kinetic.WorkFlowLayer = function (config)
{
	Kinetic.Layer.apply(this, [config]);
	this.currentElements = new Array();
	this.classType = "WorkFlowLayer";
	this.standAloneWF = null;
	this.ioMode = false;
	this.ioObjects = {input:null,output:null};
	this.getComponents = function(includeStartEnd)
	{
		if(this.standAloneWF == null)
		{
			if(includeStartEnd)
			{
				return this.currentElements;
			}
			else
			{
				//gets all the components that are not start or ends
				var returnEls =  _.filter(this.currentElements,function(el)
				{
					return ((el instanceof Kinetic.WorkFlow) || (el instanceof Kinetic.WorkFlowComponent))
				});	
				return returnEls;
			}
		}
		else
		{
			return this.standAloneWF.components;
		}
		
		
	};
	this.toggleIOMode = function ()
	{
		if(this.ioMode)
		{
			this.ioMode = false;
			//remove all events listening for the click
			this.setUpIOMode();
		}
		else
		{
			this.ioMode = true;
			this.setUpIOMode();
		}
		return this.ioMode;
	};
	this.setIOMode = function(mode)
	{
		this.ioMode = mode;
		//setup the IO mode, based on the setting
		this.setUpIOMode();
	}
	this.setIoObjects = function(el)
	{
		//if user has clicked an item again then, this means they do not want to select it
		if(_.isEqual(el,this.ioObjects.output))
		{
			this.ioObjects.output = null;
			return false;
		}
		else if(_.isEqual(el,this.ioObjects.input))
		{
			this.ioObjects.input = null;
			return false;
		}
		
		if(this.ioObjects.output == null)
		{
			//first click should be the outputs
			this.ioObjects.output = el;
			//if both objects now set, then open up the modal
			if(this.ioObjects.input != null && this.ioObjects.output != null)
			{
				if(this.ioObjects.input instanceof Kinetic.WorkFlowTerminalNodes || this.ioObjects.output instanceof Kinetic.WorkFlowTerminalNodes)
				{
					WorkFlow_UI.ioWorkFlow.open(this.ioObjects);	
				}
				else
				{
					WorkFlow_UI.io.open(this.ioObjects);
				}
					
					
			}
			return true;
		}	
		else if (this.ioObjects.input == null)
		{
			this.ioObjects.input = el;
			//if both objects now set, then open up the modal
			if(this.ioObjects.input instanceof Kinetic.WorkFlowTerminalNodes || this.ioObjects.output instanceof Kinetic.WorkFlowTerminalNodes)
			{
				WorkFlow_UI.ioWorkFlow.open(this.ioObjects);	
			}
			else
			{
				WorkFlow_UI.io.open(this.ioObjects);
			}
			return true;
		}
		else
		{
			//this should not happen, as after two have been clicked.
			//popup should appear, and after ioObjects should be cleared
			console.error('Both ioObjects set, they have not been cleared correctly');
		}
		
			
	};
	this.updateComponentOrder = function(order)
	{
		var newOrder = [];
		var self = this;
		_.each(order,function(comId)
		{
			var next = _.find(self.getComponents(false), function(com)
			{
				return com._id == comId;
			});
			
			newOrder.push(next);
		});
		if(this.standAloneWF == null)
		{
			if(this.currentElements[0] instanceof Kinetic.WorkFlowStart)
			{
				newOrder.unshift(this.currentElements[0]);
			}
			if(this.currentElements[this.currentElements.length - 1] instanceof Kinetic.WorkFlowEnd)
			{
				newOrder.push(this.currentElements[this.currentElements.length - 1]);
			}
			this.currentElements = newOrder;
		}
		else
		{
			this.standAloneWF.components = newOrder;
		}
		
	};
	this.getIndexOfElement = function (workflow)
		{
			for(iCEls=0;iCEls<this.currentElements.length;iCEls++)
			{
				if (_.isEqual(workflow,this.currentElements[iCEls]))
				{
					return iCEls;
				}
			}
		};
	this.standAloneIndex = -1;
	this.renderRubbishBin();
	
		
}
Kinetic.WorkFlowLayer.prototype = {
	renderRubbishBin : function()
	{
		//add the trash bin to the top right
		var self = this;
		var imageObj = new Image();
		    imageObj.onload = function() {
		      self.image = new Kinetic.Image({
		        x: $(document).width()-100,
		        y: 0,
		        image: imageObj,
		        width: 100,
		        height: 100
		      });
		      self.add(self.image);
		      self.draw();
		   };
		   
		   imageObj.src = "img/trash.png";

	},
	checkOverBin : function(el,ev)
	{
		imgAttrs = this.image.getAttrs();
		if(ev.layerX > imgAttrs.x && ev.layerX < (imgAttrs.x + imgAttrs.width))
		{
			//within x boundaries
			if(ev.layerY > imgAttrs.y && ev.layerY < (imgAttrs.y + imgAttrs.height))
			{
				//over bin so delete the element
				this.deleteElement(el);
			}
		}
	},
	updateConnectionOrders : function()
	{
		if(this.standAloneWF == null)
		{
			this.disconnectAllVertices();
			//now we need to setup the all the vertices
			this.setOrderedVertices();
			//then we need connect all the input/outputs
			_.each(this.getComponents(false),function(el)
			{
				el.connectAllIOs();
			});
			
		}
		else
		{
			_.each(this.standAloneWF.components,function(el)
			{
				el.disconnectAllVertices();
			});
			//now we need to setup the all the vertices
			this.setOrderedVertices();
			//then we need connect all the input/outputs
			_.each(this.standAloneWF.components,function(el)
			{
				el.connectAllIOs();
			});
		}
		this.draw();
	},
	disconnectAllVertices : function()
	{
		_.each(this.currentElements,function(el)
		{
			el.disconnectAllVertices();
		});
	},
	setOrderedVertices : function ()
	{
		if(this.standAloneWF == null)
		{
			//loop all elements
			for(var elI = 0; elI < this.currentElements.length; elI++)
			{
				this.draw();
				//if not the last element, then join to the next elements
				if(elI != this.currentElements.length -1)
				{
					this.currentElements[elI].connectToEl(this.currentElements[elI+1]);
				}
				if(this.currentElements[elI] instanceof Kinetic.WorkFlow)
				{
					this.currentElements[elI].setOrderedVertices();
				}
			}
		}
		else
		{
			this.standAloneWF.setOrderedVertices();
		}
	},
	renderWorkFlow : function(workFlow)
	{
		//if the argument is a number then it is the index of a component which should be rendered
		workFlow = _.isNumber(workFlow) ? this.currentElements[workFlow] : workFlow;
		//need to save the index of the render workflow, as thsi will need to overwritten
		this.standAloneIndex = this.getIndexOfElement(workFlow);
		this.disconnectAllVertices();
		//clear the stage so it is blank
		this.clear();
		this.removeChildren();
		
		//create
		this.standAloneWF = new Kinetic.WorkFlow({text:workFlow.title,brokerProperties:workFlow.brokerProperties,x:100,y:10,draggable:false,layer:this,standalone:true});
		this.standAloneWF.setVertices(workFlow.vertices,workFlow);
		this.standAloneWF.setStartEl(workFlow);
		this.add(this.standAloneWF);
		this.standAloneWF.configStart = workFlow.configStart;
		this.standAloneWF.addElements(workFlow.components);
		this.standAloneWF.addConnectionsToLayer();
		
		//turn off io Mode and remove onClicks
		this.setIOMode(false);
		
		//create bin for lower layer
		this.renderRubbishBin();
		
		this.draw();
		this.standAloneWF.updateAllVertices();
	},
	addElement : function (el)
	{
		//need to return the index, its used for adding a new workflow
		var returnIndex;
		if(this.standAloneWF == null)
		{
			//add element to the viewing layer
			this.add(el);
			//if there is an workflow end, we need to add the element before this
			if(this.currentElements[this.currentElements.length -1] instanceof Kinetic.WorkFlowEnd)
			{
				
				end = this.currentElements.pop();
				this.currentElements.push(el);
				this.currentElements.push(end);
				returnIndex = this.currentElements.length - 2;
			}
			else
			{
				this.currentElements.push(el);
				returnIndex = this.currentElements.length - 1;
			}
			//add connections to the workflow
			this.updateConnectionOrders();
		}
		else
		{
			//add the element to the standalone workflow, send it as an array
			this.standAloneWF.addElements([el]);
			returnIndex = this.standAloneWF.getLastComponentIndex();
			
		}
		//redraw the layer
		this.draw();
		return returnIndex;
	},
	deleteElement : function (el)
	{
		if(this.standAloneWF == null)
		{
			//if the argument is a number then it is the index of a component which should be rendered
			el = _.isNumber(el) ? this.currentElements[el] : el;
			
			el.deleteAllIOs();
			//remove the element from the currentElements
			this.currentElements.splice(this.getIndexOfElement(el), 1);
			this.remove(el);
		
		}
		else
		{
			//delete the component from the standAlone workflow
			this.standAloneWF.deleteElement(el);
			
		}
		//update the ordering connections
		this.updateConnectionOrders();
		this.draw();
	},
	moveUp : function ()
	{
		if(this.standAloneWF != null)
		{
			//create a new workflow from the standAlone workflow
			tempEl = new Kinetic.WorkFlow({text:this.standAloneWF.title,brokerProperties:this.standAloneWF.brokerProperties,x:100,y:10,draggable:true,layer:this,standalone:false});
			//add this to the layer, as it will need a reference to a layer whilst
			//setting vertices
			this.add(tempEl);
			//set the vertices of the new temp workflow
			tempEl.setVertices(this.standAloneWF.vertices,this.standAloneWF);
			tempEl.setStartEl(this.standAloneWF);
			//add all the standalone element to the temp workflow
			tempEl.addElements(this.standAloneWF.components);
			//add the tempWF to the current elements, overwrite it if an index has been found
			if(this.standAloneIndex == -1)
			{
				this.currentElements.push(tempEl);
				this.currentElements[this.currentElements.length - 2].connectTo(this.currentElements[this.currentElements.length - 1]);
			}
			else
			{
				this.currentElements[this.standAloneIndex] = tempEl;
			}
			//now clear the layer so all components can be rendered
			this.clear();
			this.removeChildren();
			//add all the current elements to the l
			for(iCEls=0;iCEls<this.currentElements.length;iCEls++)
			{
				this.add(this.currentElements[iCEls]);
				this.currentElements[iCEls].addConnectionsToLayer();
			}
			this.setIOMode(false);
			this.draw();
			this.reDrawLayer();
			this.updateAllVertices();
			
			//render rubbish bin for the top layer
			this.renderRubbishBin();
			this.standAloneWF = null;
			this.standAloneIndex = -1;
			this.updateConnectionOrders();
		}
	},
	setUpIOMode : function ()
	{
		if(this.ioMode)
		{
			$("#io").html('Toggle Input/Output Mode - On');
			if(this.standAloneWF == null)
			{
				//all currentEls need to be clickable
				for(iCEls=0;iCEls<this.currentElements.length;iCEls++)
				{
					this.currentElements[iCEls].on('click',function()
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
				for(iCEls=0;iCEls<this.standAloneWF.components.length;iCEls++)
				{
					this.standAloneWF.components[iCEls].on('click',function()
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
				this.standAloneWF.startElement.on('click',function()
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
			$("#io").html('Toggle Input/Output Mode - Off');
			this.ioObjects = {input:null,output:null};
			if(this.standAloneWF == null)
			{
				//all currentEls non clickable
				for(iCEls=0;iCEls<this.currentElements.length;iCEls++)
				{
					if(this.currentElements[iCEls] instanceof Kinetic.WorkFlow || this.currentElements[iCEls] instanceof Kinetic.WorkFlowComponent)
					{
						this.currentElements[iCEls].off('click');
						this.currentElements[iCEls].setStroke('black');
					}
					
				}
				this.getLayer().draw();
			}
			else
			{
				for(iCEls=0;iCEls<this.standAloneWF.components.length;iCEls++)
				{
					this.standAloneWF.components[iCEls].off('click');
					this.standAloneWF.components[iCEls].setStroke('black');
				}
				this.getLayer().draw();
			}
		}
	},
	clearIOMode : function()
	{
		if (this.ioObjects.input != null)
		{
			this.ioObjects.input.setStroke('black');
		} 
		if (this.ioObjects.output != null)
		{
			this.ioObjects.output.setStroke('black');
		} 
		this.ioObjects = {input:null,output:null};
		this.draw();
	},
	clearLayer : function ()
	{
		this.currentElements = [];
		this.clear();
		this.removeChildren();
		this.renderRubbishBin();
	},
	reDrawLayer : function ()
	{
		//width of the current element
		var currentWidth = 0;
		//current width of the row, ie elements that will be in it
		var rowWidth = 0;
		//row to be rendered, when it is correct width
		var rowArray = [];
		//Y position of the last row, rows start at 50
		var lastYRow = 30;
		nextRowY = 0;
		//number of rows rendered
		var noRows = 0;
		for(iCEls=0;iCEls<this.currentElements.length;iCEls++)
		{
			//overwrite the position of the group, as this causes offset problems
			this.currentElements[iCEls].setPosition({x:0,y:0});
			currentWidth = this.currentElements[iCEls].getWidth() + 15;
				
			//check if adding this current width will overflow the canvas
			if((rowWidth+currentWidth)>this.getStage().getWidth()-40)
			{
				//row needs to be rendered
				noRows++;
				//render the row
				nextRowY = this.renderRow(noRows,rowArray,lastYRow,rowWidth);
				//incease position of last row
				lastYRow = nextRowY+20;
				//clear the row array
				rowArray = [];
				rowWidth = 0;
				//add current element to rowArray, for the next row
				rowArray.push(this.currentElements[iCEls]);
				rowWidth +=currentWidth;
				
			}
			else
			{
				//add this element to the row array
				rowArray.push(this.currentElements[iCEls]);
				rowWidth +=currentWidth;
			}
		}
		//output the last row, that was not exectuted during the loop
		noRows++;
		this.renderRow(noRows,rowArray,lastYRow,rowWidth);
		this.draw();
		this.updateAllVertices();
		//
	},
	renderRow : function(noRows,rowArray,lastYRow,rowWidth)
	{
		if (noRows%2 == 0)
		{
			return this.setUpBackwardsRow(rowArray,lastYRow,rowWidth);
		}
		else
		{
			return this.setUpForwardsRow(rowArray,lastYRow,rowWidth);
		}	
	},
	setUpForwardsRow : function(rowArray,lastYRow,rowWidth)
	{
		//the X value to write to next
		var currentX = 40;
		var self = this;
		var ys = this.findYPosForRow(rowArray);
		var minY = _.min(_.values(ys));
		lastYRow += Math.abs(minY);
		var nextYRow = 0;
		_.each(rowArray,function(rowEl)
		{
			//find the margin between elements
			margin = (self.getStage().getWidth()-rowWidth +40)/rowArray.length - 1
			rowEl.setAllPositions({x:currentX,y:lastYRow+ys[rowEl._id]});
			if(nextRowY<rowEl.getHeight()+lastYRow)
			{
				nextRowY = rowEl.getHeight()+lastYRow;
			}
			currentX += margin;
			currentX += rowEl.getWidth();
		})
		return nextRowY;
	},
	setUpBackwardsRow : function(rowArray,lastYRow,rowWidth)
	{
		//the X value to write to next
		var currentX = this.getStage().getWidth()-20 ;;
		var self = this;
		var ys = this.findYPosForRow(rowArray);
		var minY = _.min(_.values(ys));
		lastYRow += Math.abs(minY);
		
		_.each(rowArray,function(rowEl)
		{
			//find the margin
			margin = (self.getStage().getWidth()+40-rowWidth)/rowArray.length - 1
			rowEl.setAllPositions({x:currentX- rowEl.getWidth(),y:lastYRow+ys[rowEl._id]});
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
	findNextPosition : function()
	{
		//loop through all children.
		var children  = this.getChildren();
		var onTop = true;
		size = {x:10,y:10};
		smallestX = -1;
		biggestX = -1;
		biggestY = -1;
		smallestX = -1;
		//need to find if the rect drawn will cover any other element
		for(i=0;i<children.length;i++)
		{
			//if workflow, then check mainElement.rect x,y,w,h
			rectArray = this.recurseToFindAllChildRect(children[i]);
			for(i1=0;i1<rectArray.length;i1++)
			{
				rect = rectArray[i1];
				rectAttrs = rect.getAttrs();
				//now need to find a new position
				if(rect instanceof Kinetic.Circle)
				{
					if(smallestX == -1)
					{
						smallestX = rectAttrs.x - rectAttrs.radius;
						biggestX = rectAttrs.x + rectAttrs.radius;
						smallestY = rectAttrs.y - rectAttrs.radius
						biggestY = rectAttrs.y + rectAttrs.radius;
						biggestYH = rectAttrs.radius;
					}
					if(rectAttrs.x < smallestX)
					{
						smallestX = rectAttrs.x - rectAttrs.radius;
					}
					if(rectAttrs.y < smallestY)
					{
						smallestY = rectAttrs.y - rectAttrs.radius;
					}
					
					if((rectAttrs.x + rectAttrs.width) > biggestX)
					{
						biggestX = (rectAttrs.x + rectAttrs.radius);
					}
					if((rectAttrs.y + rectAttrs.height) > biggestY)
					{
						biggestY = (rectAttrs.y + rectAttrs.radius);
						biggestYH = rectAttrs.radius;
					}
				}
				else
				{
					
					if(smallestX == -1)
					{
						smallestX = rectAttrs.x;
						biggestX = rectAttrs.x + rectAttrs.width;
						smallestY = rectAttrs.y
						biggestY = rectAttrs.y + rectAttrs.height;
						biggestYH = rectAttrs.y;
					}
					if(rectAttrs.x < smallestX)
					{
						smallestX = rectAttrs.x;
					}
					if(rectAttrs.y < smallestY)
					{
						smallestY = rectAttrs.y;
					}
					
					if((rectAttrs.x + rectAttrs.width) > biggestX)
					{
						biggestX = (rectAttrs.x + rectAttrs.width);
					}
					if((rectAttrs.y + rectAttrs.height) > biggestY)
					{
						biggestY = (rectAttrs.y + rectAttrs.height);
						biggestYH = rectAttrs.height;
					}
				}

			}
			
		}
		
			
		//want to set the new position at either
		
		//On right and at the biggestY. If there is enough space on the right
		if((biggestX+300)+40<this.getSize().width)
		{
			//there is enough room
			size.x = biggestX+20;
			size.y = biggestY;
			return size;
		}
		else
		{
			//or at the bottom on the left. so x = 0 +10 and y=biggestY+20
			size.x = smallestX;
			size.y = biggestY + biggestYH;
			return size;
		}
		
	},
	findNextPositionVertical : function()
	{
		//loop through all children.
		
		var onTop = true;
		size = {x:10,y:10};
		smallestX = -1;
		biggestX = -1;
		biggestY = -1;
		smallestX = -1;
		//need to find if the rect drawn will cover any other element
		
		//if workflow, then check mainElement.rect x,y,w,h
		rectArray = this.recurseToFindAllChildRect(this);
		for(i1=0;i1<rectArray.length;i1++)
		{
			rect = rectArray[i1];
			
			//now need to find a new position
			if(rect instanceof Kinetic.Circle)
			{
				if(biggestY == -1)
				{
					biggestY = rect.getPosition().y + rect.getAttrs().radius;
					lowestEl = rect;
					
				}
				if((rect.getPosition().y + rect.getAttrs().height) > biggestY)
				{
					biggestY = (rect.getPosition().y + rect.rect.getAttrs().radius);
					lowestEl = rect;

				}
			}
			else
			{
				
				if(biggestY == -1)
				{
					biggestY = rect.getPosition().y + rect.getAttrs().height;
					lowestEl = rect;
				}
				if((rect.getPosition().y + rect.getAttrs().height) > biggestY)
				{
					biggestY = (rect.getPosition().y + rect.getAttrs().height);
					lowestEl = rect;
				}
			}

		}
		
	
		
			
		if(lowestEl instanceof Kinetic.Circle)
		{
			size = {x:(lowestEl.getPosition().x-(150/2)),y:(lowestEl.getPosition().y+(lowestEl.getAttrs().radius + 40))};
			return size;
		}			
		else
		{
			xPos = ((lowestEl.getPosition().x + (lowestEl.getWidth()/2)) - 150/2)
			size = {x:lowestEl.getPosition().x,y:(lowestEl.getPosition().y + lowestEl.getSize().height+20)}
			if(size.y>this.getStage().getHeight())
			{
				this.getStage().setSize(this.getStage().getWidth(),size.y + 200);
			}
			return size;
		}		
	},
	recurseToFindAllChildRect : function(child)
	{
		var rectArray = new Array();
		for(i=0;i<child.children.length;i++)
		{
			//if workflow, then check mainElement.rect x,y,w,h
			if(child.children[i] instanceof Kinetic.WorkFlow)
			{
				rectArray.push(child.children[i].mainElement.rect);
				
			}
			else if(child.children[i] instanceof Kinetic.WorkFlowComponent)
			{
				rectArray.push(child.children[i].rect);
			}
			else if (child.children[i] instanceof Kinetic.WorkFlowStart || child.children[i] instanceof Kinetic.WorkFlowEnd)
			{
				rectArray.push(child.children[i].circle);
			}
			else if (child.children[i] instanceof Kinetic.Connection)
			{
				
			}
			else
			{
				rectArray = rectArray.concat(this.recurseToFindAllChildRect(child.children[i]));
			}
			
		}
		return rectArray;
		
	},
	updateAllVertices : function ()
	{
		for(wFs=0;wFs<this.currentElements.length;wFs++)
        {
        	this.currentElements[wFs].updateAllVertices();
        }
	},
	createWorkFlow : function()
	{
		var mainWorkFlow = new UncertWeb.Workflow();
		for(iCEls=0;iCEls<this.currentElements.length;iCEls++)
		{
			if(this.currentElements[iCEls] instanceof Kinetic.WorkFlow)
			{
				//create new workflow
				var workflow = new UncertWeb.Workflow();
				for(iWFEls=0;iWFEls<this.currentElements[iCEls].components.length;iWFEls++)
				{
					//add the components to that workflow
					workflow.append(new UncertWeb.Component(this.currentElements[iCEls].components[iWFEls].brokerProperties));
				}
				mainWorkFlow.append(workflow);
			}
			else if (this.currentElements[iCEls] instanceof Kinetic.WorkFlowComponent)
			{
				mainWorkFlow.append(new UncertWeb.Component(this.currentElements[iCEls].brokerProperties))
			}
		}
		return mainWorkFlow;
		
		
	},
	publishWorkFlow : function()
	{
		
	}
	
	
};
	
Kinetic.GlobalObject.extend(Kinetic.WorkFlowLayer, Kinetic.Layer);