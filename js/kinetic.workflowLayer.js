Kinetic.WorkFlowLayer = function (config)
{
	Kinetic.Layer.apply(this, [config]);
	this.currentElements = new Array();
	this.classType = "WorkFlowLayer";
	this.standAloneWF = null;
	this.ioMode = false;
	this.ioObjects = {input:null,output:null};
	
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
				WorkFlow_UI.io.open(this.ioObjects);		
			}
			return true;
		}	
		else if (this.ioObjects.input == null)
		{
			this.ioObjects.input = el;
			//if both objects now set, then open up the modal
			if(this.ioObjects.input != null && this.ioObjects.output != null)
			{
				WorkFlow_UI.io.open(this.ioObjects);		
			}
			return true;
		}
		else
		{
			//this should not happen, as after two have been clicked.
			//popup should appear, and after ioObjects should be cleared
		}
		
			
	};
	
	this.getStandAloneIndex = function (workflow)
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
}
Kinetic.WorkFlowLayer.prototype = {
	renderWorkFlow : function(workFlow)
	{
		this.standAloneIndex = this.getStandAloneIndex(workFlow);
		//clear the stage so it is blank
		this.clear();
		this.removeChildren();
		//create new layer
		
		//text that was in the main element should go to the top of the screen as a title
		//create a new workflow, with standalone set to true, this will stop the mainElement rendering
		this.standAloneWF = new Kinetic.WorkFlow({text:'[3] Mulitple Instances (one for each environmental dataset',x:100,y:10,draggable:false,layer:this,standalone:true});
		this.standAloneWF.setVertices(workFlow.vertices,workFlow);
		this.add(this.standAloneWF);
		
		this.standAloneWF.addElements(workFlow.components);
		this.standAloneWF.addConnectionsToLayer();
		this.ioMode = false;
			//remove all events listening for the click
		this.setUpIOMode();
		this.draw();
		this.standAloneWF.updateAllVertices();
	},
	addElement : function (el)
	{
		this.add(el);
		if(this.currentElements[this.currentElements.length -1] instanceof Kinetic.WorkFlowEnd)
		{
			end = this.currentElements.pop();
			this.currentElements.push(el);
			this.currentElements.push(end);
		}
		else
		{
			this.currentElements.push(el);
		}
		
		this.draw();
	},
	moveUp : function ()
	{
		if(this.standAloneWF != null)
		{
						//update the currentElements, using standAloneWF
			//standAloneWF has to updated,as the layout is different
			tempEl = new Kinetic.WorkFlow({text:'test moveUp',x:100,y:10,draggable:true,layer:this,standalone:false});
			this.add(tempEl);
			//the reference in the array has to be updated to the new element
			tempEl.setVertices(this.standAloneWF.vertices,this.standAloneWF);
			
			tempEl.addElements(this.standAloneWF.components);
			if(this.standAloneIndex == -1)
			{
				this.currentElements.push(tempEl);
				this.currentElements[this.currentElements.length - 2].connectTo(this.currentElements[this.currentElements.length - 1]);
			}
			else
			{
				this.currentElements[this.standAloneIndex] = tempEl;
			}
			this.clear();
			this.removeChildren();
			
			for(iCEls=0;iCEls<this.currentElements.length;iCEls++)
			{
				this.add(this.currentElements[iCEls]);
				
				this.currentElements[iCEls].addConnectionsToLayer();
				
			}
			this.ioMode = false;
			//remove all events listening for the click
			this.setUpIOMode();
			this.draw();
			this.reDrawLayer();
			this.updateAllVertices();
					
			this.standAloneWF = null;
			this.standAloneIndex = -1;
		}
	},
	setUpIOMode : function ()
	{
		if(this.ioMode)
		{
			if(this.standAloneWF == null)
			{
				//all currentEls need to be clickable
				for(iCEls=0;iCEls<this.currentElements.length;iCEls++)
				{
					
					if(this.currentElements[iCEls] instanceof Kinetic.WorkFlow || this.currentElements[iCEls] instanceof Kinetic.WorkFlowElement)
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
			}

		}
		else
		{
			this.ioObjects = {input:null,output:null};
			if(this.standAloneWF == null)
			{
				//all currentEls non clickable
				for(iCEls=0;iCEls<this.currentElements.length;iCEls++)
				{
					if(this.currentElements[iCEls] instanceof Kinetic.WorkFlow || this.currentElements[iCEls] instanceof Kinetic.WorkFlowElement)
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
			}
		}
	},
	reDrawLayer : function ()
	{
		//when a new element is added
		//if this.standaloneWF == null
		//loop through all the current elements
		
		currentWidth = 0;
		rowWidth = 0;
		rowArray = new Array();
		lastYRow = 50;
		nextRowY = 0;
		noRows = 0;
		for(iCEls=0;iCEls<this.currentElements.length;iCEls++)
		{
			//get width of current element
			this.currentElements[iCEls].setPosition({x:0,y:0});
			currentWidth = this.currentElements[iCEls].getWidth() + 20;
				
			//check if adding this current width will overflow the canvas
			if((rowWidth+currentWidth)>this.getStage().getWidth()-50)
			{
				
				//update the X,Ys
				noRows++;
				if (noRows%2 == 0)
					nextRowY = this.setUpBackwardsRow(rowArray,lastYRow,rowWidth);
				else
					nextRowY = this.setUpForwardsRow(rowArray,lastYRow,rowWidth);
				
				lastYRow = nextRowY+40;
				
				//clear the row array
				rowArray = new Array();
				rowWidth = 0;
				//add the current element to the row, for next row
				rowArray.push(this.currentElements[iCEls]);
				rowWidth +=currentWidth;
				
			}
			else
			{
				//add this element to the row array
				rowArray.push(this.currentElements[iCEls]);
				rowWidth +=currentWidth;
			}
			//first loop until have found widths that add up to a first row
			//when you have that, loop through that row array
			//update the x and ys of the group
		}
		noRows++;
		if (noRows%2 == 0)
			nextRowY = this.setUpBackwardsRow(rowArray,lastYRow,rowWidth);
		else
			nextRowY = this.setUpForwardsRow(rowArray,lastYRow,rowWidth);		
		this.draw();
		this.updateAllVertices();
		//
	},
	setUpForwardsRow : function(rowArray,lastYRow,rowWidth)
	{
		currentX = 40;
		for(iR=0;iR<rowArray.length;iR++)
		{
			//find the margin
			margin = (this.getStage().getWidth()-rowWidth +40)/rowArray.length - 1
			if(rowArray[iR] instanceof Kinetic.WorkFlow || rowArray[iR] instanceof Kinetic.WorkFlowElement)
			{
				if(iR != 0)
				{
					if(rowArray[iR-1] instanceof Kinetic.WorkFlowStart)
					{
						rowArray[iR].setAllPositions({x:currentX+rowArray[iR-1].getWidth()/2,y:lastYRow});
					}
					else
					{
						
						y = rowArray[iR-1].getHeight()/2-rowArray[iR].getHeight()/2;
						y += lastYRow;
						lastYRow = y;
						rowArray[iR].setAllPositions({x:currentX,y:y});
					}
					
				}
				else
				{
					//as this is the first element, need to move down to allow room for el with greatest height
					greatestHeight = this.findGreatestHeight(rowArray);
					y = greatestHeight/2-rowArray[iR].getHeight()/2;
					y += lastYRow;
					lastYRow = y;
					rowArray[iR].setAllPositions({x:currentX,y:y});
				}
				
				if(nextRowY<rowArray[iR].getHeight()+lastYRow)
				{
					nextRowY = rowArray[iR].getHeight()+lastYRow;
				}
				
			}
			else if (rowArray[iR] instanceof Kinetic.WorkFlowStart || rowArray[iR] instanceof Kinetic.WorkFlowEnd)
			{
				if(iR != rowArray.length-1)
				{
					//if its a start node it needs to be moved a little down so rectangles can be lined up without going off the top
					nextElH = rowArray[iR+1].getHeight()/2;
					y = lastYRow + nextElH;
					rowArray[iR].setAllPositions({x:currentX,y:y});
				}
				else
				{
					y = rowArray[iR-1].getHeight()/2;
					y += lastYRow;
					lastYRow = y;
					rowArray[iR].setAllPositions({x:currentX,y:y});
				}
				
				if(nextRowY<rowArray[iR].getHeight()+lastYRow)
				{
					nextRowY = rowArray[iR].getHeight()+lastYRow;
				}
			}
			currentX += margin;
			currentX += rowArray[iR].getWidth();
		}
		return nextRowY;
	},
	setUpBackwardsRow : function(rowArray,lastYRow,rowWidth)
	{
		currentX = this.getStage().getWidth()-20 ;
		for(iR=0;iR<rowArray.length;iR++)
		{
			//find the margin
			margin = (this.getStage().getWidth()+40-rowWidth)/rowArray.length - 1
			if(rowArray[iR] instanceof Kinetic.WorkFlow || rowArray[iR] instanceof Kinetic.WorkFlowElement)
			{
				if(iR != 0)
				{
					if(rowArray[iR-1] instanceof Kinetic.WorkFlowStart)
					{
						rowArray[iR].setAllPositions({x:currentX - rowArray[iR].getWidth()/2,y:lastYRow});
					}
					else
					{
						
						y = rowArray[iR-1].getHeight()/2-rowArray[iR].getHeight()/2;
						y += lastYRow;
						lastYRow = y;
						rowArray[iR].setAllPositions({x:currentX - rowArray[iR].getWidth(),y:y});
					}
					
				}
				else
				{
					//as this is the first element, need to move down to allow room for el with greatest height
					greatestHeight = this.findGreatestHeight(rowArray);
					y = greatestHeight/2-rowArray[iR].getHeight()/2;
					y += lastYRow;
					lastYRow = y;
					rowArray[iR].setAllPositions({x:currentX - rowArray[iR].getWidth(),y:y});
				}
				
				if(nextRowY<rowArray[iR].getHeight()+lastYRow)
				{
					nextRowY = rowArray[iR].getHeight()+lastYRow;
				}
				
			}
			else if (rowArray[iR] instanceof Kinetic.WorkFlowStart || rowArray[iR] instanceof Kinetic.WorkFlowEnd)
			{
				if(iR != rowArray.length-1)
				{
					//if its a start node it needs to be moved a little down so rectangles can be lined up without going off the top
					nextElH = rowArray[iR+1].getHeight()/2;
					y = lastYRow + nextElH;
				}
				else
				{
					y = rowArray[iR-1].getHeight()/2;
					y += lastYRow;
					lastYRow = y;
				}
				rowArray[iR].setAllPositions({x:currentX,y:y});
				if(nextRowY<rowArray[iR].getHeight()+lastYRow)
				{
					nextRowY = rowArray[iR].getHeight()+lastYRow;
				}
			}
			currentX -= margin;
			currentX -= rowArray[iR].getWidth();
	
		}
		return nextRowY;
	},
	findGreatestHeight : function (rowArray)
	{
		greatestHeight =0;
		for(iGH=0;iGH<rowArray.length;iGH++)
		{
			if(greatestHeight<rowArray[iGH].getHeight())
			{
				greatestHeight = rowArray[iGH].getHeight();
			}
		}
		return greatestHeight;
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
				
				//now need to find a new position
				if(rect instanceof Kinetic.Circle)
				{
					if(smallestX == -1)
					{
						smallestX = rect.getPosition().x - rect.getAttrs().radius;
						biggestX = rect.getPosition().x + rect.getAttrs().radius;
						smallestY = rect.getPosition().y - rect.getAttrs().radius
						biggestY = rect.getPosition().y + rect.getAttrs().radius;
						biggestYH = rect.getPosition().radius;
					}
					if(rect.getPosition().x < smallestX)
					{
						smallestX = rect.getPosition().x - rect.getAttrs().radius;
					}
					if(rect.getPosition().y < smallestY)
					{
						smallestY = rect.getPosition().y -rect.getAttrs().radius;
					}
					
					if((rect.getPosition().x + rect.getAttrs().width) > biggestX)
					{
						biggestX = (rect.getPosition().x + rect.getAttrs().radius);
					}
					if((rect.getPosition().y + rect.getAttrs().height) > biggestY)
					{
						biggestY = (rect.getPosition().y + rect.rect.getAttrs().radius);
						biggestYH = rect.getAttrs().radius;
					}
				}
				else
				{
					
					if(smallestX == -1)
					{
						smallestX = rect.getPosition().x;
						biggestX = rect.getPosition().x + rect.getAttrs().width;
						smallestY = rect.getPosition().y
						biggestY = rect.getPosition().y + rect.getAttrs().height;
						biggestYH = rect.getPosition().y;
					}
					if(rect.getPosition().x < smallestX)
					{
						smallestX = rect.getPosition().x;
					}
					if(rect.getPosition().y < smallestY)
					{
						smallestY = rect.getPosition().y;
					}
					
					if((rect.getPosition().x + rect.getAttrs().width) > biggestX)
					{
						biggestX = (rect.getPosition().x + rect.getAttrs().width);
					}
					if((rect.getPosition().y + rect.getAttrs().height) > biggestY)
					{
						biggestY = (rect.getPosition().y + rect.getAttrs().height);
						biggestYH = rect.getAttrs().height;
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
			else if(child.children[i] instanceof Kinetic.WorkFlowElement)
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
	convertToBPMN : function()
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
			else if (this.currentElements[iCEls] instanceof Kinetic.WorkFlowElement)
			{
				mainWorkFlow.append(new UncertWeb.Component(this.currentElements[iCEls].brokerProperties))
			}
		}
		var BPNM = UncertWeb.Encode.asBPMN(mainWorkFlow);
		console.log(BPNM);
		
	}
	
	
};
	
Kinetic.GlobalObject.extend(Kinetic.WorkFlowLayer, Kinetic.Layer);