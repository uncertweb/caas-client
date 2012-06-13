Kinetic.WorkFlowStage = function (config)
{
	Kinetic.Stage.apply(this, [config]);
}
Kinetic.WorkFlowStage.prototype = {
	checkXY : function(size)
	{
		//loop through all children.
		var children  = this.getChildren();
		var onTop = true;
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
				if(this.checkOnTop(size,rect))
				{
					onTop = true;						
				}
				//now need to find a new position
				if(rect instanceof Kinetic.Circle)
				{
					if(smallestX == -1)
					{
						smallestX = rect.getAbsolutePosition().x - rect.getAttrs().radius;
						biggestX = rect.getAbsolutePosition().x + rect.getAttrs().radius;
						smallestY = rect.getAbsolutePosition().y - rect.getAttrs().radius
						biggestY = rect.getAbsolutePosition().y + rect.getAttrs().radius;
						biggestYH = rect.getAbsolutePosition().y - rect.getAbsolutePosition().y - 40;
					}
					if(rect.getAbsolutePosition().x < smallestX)
					{
						smallestX = rect.getAbsolutePosition().x - rect.getAttrs().radius;
					}
					if(rect.getAbsolutePosition().y < smallestY)
					{
						smallestY = rect.getAbsolutePosition().y -rect.getAttrs().radius;
					}
					
					if((rect.getAbsolutePosition().x + rect.getAttrs().width) > biggestX)
					{
						biggestX = (rect.getAbsolutePosition().x + rect.getAttrs().radius);
					}
					if((rect.getAbsolutePosition().y + rect.getAttrs().height) > biggestY)
					{
						biggestY = (rect.getAbsolutePosition().y + rect.rect.getAttrs().radius);
						biggestYH = rect.getAbsolutePosition().y;
					}
				}
				else
				{
					
					if(smallestX == -1)
					{
						smallestX = rect.getAbsolutePosition().x;
						biggestX = rect.getAbsolutePosition().x + rect.getAttrs().width;
						smallestY = rect.getAbsolutePosition().y
						biggestY = rect.getAbsolutePosition().y + rect.getAttrs().height;
						biggestYH = rect.getAbsolutePosition().y;
					}
					if(rect.getAbsolutePosition().x < smallestX)
					{
						smallestX = rect.getAbsolutePosition().x;
					}
					if(rect.getAbsolutePosition().y < smallestY)
					{
						smallestY = rect.getAbsolutePosition().y;
					}
					
					if((rect.getAbsolutePosition().x + rect.getAttrs().width) > biggestX)
					{
						biggestX = (rect.getAbsolutePosition().x + rect.getAttrs().width);
					}
					if((rect.getAbsolutePosition().y + rect.getAttrs().height) > biggestY)
					{
						biggestY = (rect.getAbsolutePosition().y + rect.getAttrs().height);
						biggestYH = rect.getAbsolutePosition().y;
					}
				}

			}
			
		}
		if(onTop)
		{
			
			//want to set the new position at either
			
			//On right and at the biggestY. If there is enough space on the right
			/*if((biggestX+size.w)+40<this.getSize().width)
			{
				//there is enough room
				size.x = biggestX+20;
				size.y = biggestYH;
				return size;
				
			}
			else
			{*/
				//or at the bottom on the left. so x = 0 +10 and y=biggestY+20
				size.x = smallestX;
				size.y = biggestY +100;
				return size;
			//}
		}
		else
		{
			return size;
		}
		
	},
	checkOnTop : function(newRectSize,rect)
	{
		rectA = {	x:newRectSize.x,
					y:newRectSize.y,
					x1:newRectSize.x+newRectSize.w,
					y1:newRectSize.x+newRectSize.h};
		if(rect instanceof Kinetic.Circle)
		{
				rectB = {
					x:rect.getAbsolutePosition().x - rect.getAttrs().radius,
					y:rect.getAbsolutePosition().y - rect.getAttrs().radius,
					x1:rect.getAbsolutePosition().x+ rect.getAttrs().radius,
					y1:rect.getAbsolutePosition().y+ rect.getAttrs().radius			
				};

		}
		else
		{
				rectB = {
					x:rect.getAbsolutePosition().x,
					y:rect.getAbsolutePosition().y,
					x1:rect.getAbsolutePosition().x+rect.getAttrs().width,
					y1:rect.getAbsolutePosition().y+rect.getAttrs().height			
				};
		}
				
		if (rectA.x < rectB.x1 && rectA.x1 > rectB.x && rectA.y < rectB.y1 && rectA.y1 > rectB.y)
		{
			//there is an overlap
			return true;
		} 
		return false;
		
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
				rectArray = rectArray.concat(this.recurseToFindChildRect(child.children[i]));
			}
			
		}
		return rectArray;
		
	}
	
};
	
Kinetic.GlobalObject.extend(Kinetic.WorkFlowStage, Kinetic.Stage);