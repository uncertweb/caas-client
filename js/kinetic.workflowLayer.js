Kinetic.WorkFlowLayer = function (config)
{
	Kinetic.Layer.apply(this, [config]);
	this.currentElements = new Array();
	this.classType = "WorkFlowLayer";
	this.standAloneWF = null;
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
		for(iWEls=0;iWEls<workFlow.components.length;iWEls++)
		{
				this.standAloneWF.addElement({brokerProperties:workFlow.components[iWEls].brokerProperties,text:workFlow.components[iWEls].text,layer:this});
		}
		
		this.draw();
		this.standAloneWF.updateAllVertices();
	},
	addElement : function (el)
	{
		this.add(el);
		this.currentElements.push(el);
	},
	moveUp : function ()
	{
		if(this.standAloneWF != null)
		{
						//update the currentElements, using standAloneWF
			//standAloneWF has to updated,as the layout is different
			tempEl = new Kinetic.WorkFlow({text:'test moveUp',x:100,y:10,draggable:true,layer:this,standalone:false});
			this.add(tempEl);
			tempEl.setVertices(this.standAloneWF.vertices,this.standAloneWF);
			for(iWEls=0;iWEls<this.standAloneWF.components.length;iWEls++)
			{
	tempEl.addElement({brokerProperties:this.standAloneWF.components[iWEls].brokerProperties,text:this.standAloneWF.components[iWEls].text,layer:this});
			}
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
			
			this.draw();
			this.reDrawLayer();
			this.updateAllVertices();

			this.standAloneWF = null;
			this.standAloneIndex = -1;
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
		lastYRow = 100;
		nextRowY = 0;
		noRows = 0;
		for(iCEls=0;iCEls<this.currentElements.length;iCEls++)
		{
			//get width of current element
			
			currentWidth = this.currentElements[iCEls].getWidth() + 10;
				
			//check if adding this current width will overflow the canvas
			if((rowWidth+currentWidth)>this.getStage().getWidth()-40)
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
		//
	},
	setUpForwardsRow : function(rowArray,lastYRow,rowWidth)
	{
		currentX = 40;
		for(iR=0;iR<rowArray.length;iR++)
		{
			//find the margin
			margin = (this.getStage().getWidth()-rowWidth +20)/rowArray.length - 1
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
						rowArray[iR].setAllPositions({x:currentX+rowArray[iR-1].getWidth(),y:y});
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
					rowArray[iR].setAllPositions({x:currentX + rowArray[iR-1].getWidth()+margin,y:y});
				}
				
				if(nextRowY<rowArray[iR].getHeight()+lastYRow)
				{
					nextRowY = rowArray[iR].getHeight()+lastYRow;
				}
			}
			currentX += margin;
	
		}
		return nextRowY;
	},
	setUpBackwardsRow : function(rowArray,lastYRow,rowWidth)
	{
		currentX = this.getStage().getWidth()-40 ;
		for(iR=0;iR<rowArray.length;iR++)
		{
			//find the margin
			margin = (this.getStage().getWidth()+20-rowWidth)/rowArray.length - 1
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