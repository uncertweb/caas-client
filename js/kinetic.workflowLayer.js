Kinetic.WorkFlowLayer = function (config)
{
	Kinetic.Layer.apply(this, [config]);
	this.currentElements = new Array();
	this.classType = "WorkFlowLayer";
	this.standAloneWF = null;
	this.ioMode = false;
	this.ioObjects = {input:null,output:null};
	
	/*
		Getters and Setters
	*/
	this.getComponents = function(includeStartEnd)
	{
		if(this.standAloneWF == null)
		{
			if(includeStartEnd)
			{
				return this.mainWorkFlow.children;
			}
			else
			{
				return this.mainWorkFlow.components;
			}
		}
		else
		{
			return this.standAloneWF.components;
		}
	};
	this.getWorkFlows = function (noIOs)
	{
		return this.mainWorkFlow.getWorkFlows(noIOs);
	};
	this.getMainWorkFlow = function ()
	{
		return 	this.mainWorkFlow;
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
	this.updateComponentOrder = function(order)
	{
		if(this.standAloneWF == null)
		{
			this.mainWorkFlow.updateComponentOrder(order);
		}
		else
		{
			this.standAloneWF.updateComponentOrder(order);
		}
		
	};
	this.on("click", function(ev) { 
		/*if(this.standAloneWF == null)
		{
			WorkFlow_UI.toolbox.displayObject(this.mainWorkFlow);
		}
		else
		{
			WorkFlow_UI.toolbox.displayObject(this.standAloneWF);
		}*/
		
	});

	this.standAloneIndex = -1;
	this.mainWorkFlow = new Kinetic.WorkFlow({text:"Main WorkFlow",brokerProperties:{title:"",description:""},x:0,y:0,draggable:false,layer:this,type:Kinetic.WorkFlowType.main});
	
	this.add(this.mainWorkFlow);
	this.renderRubbishBin();
	
		
}
Kinetic.WorkFlowLayer.prototype = {
	/*
		Render rubbish to allow users to delete components, by dragging them to onto this bin.
	*/
	renderRubbishBin : function()
	{
		//add the trash bin to the top right
		var self = this;
		var imageObj = new Image();
		    imageObj.onload = function() {
		      self.image = new Kinetic.Image({
		        x: $('#forCanvas').width()-100,
		        y: 0,
		        image: imageObj,
		        width: 100,
		        height: 100
		      });
		      self.add(self.image);
		      self.draw();
		      self.afterDraw(WorkFlow_UI.toolbox.checkWhatNext());
		   };
		   
		   imageObj.src = "img/trash.png";

	},
	/*
		Method is called when a component is being dragged, it checks whether mouse is over the bin
		
		Arguments: el = element is element being dragged
				   ev = event for element being dragged
	*/
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
	/*
		Called when a component is clicked when IO Mode is turned on.
		The first component click is always the output.
		objects that are clicked are stored in the this.ioObjects variable
		If a component is clicked twice it is deleted from the variable.
	*/
	setIoObjects : function(el)
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
				return false;
					
			}
			return true;
		}	
		else if (this.ioObjects.input == null)
		{
			this.ioObjects.input = el;
			//if both objects now set, then open up the modal
			if(this.ioObjects.input instanceof Kinetic.WorkFlowStart || this.ioObjects.output instanceof Kinetic.WorkFlowStart)
			{
				WorkFlow_UI.ioWorkFlow.open(this.ioObjects);	
			}
			else if(this.ioObjects.input instanceof Kinetic.WorkFlowEnd || this.ioObjects.output instanceof Kinetic.WorkFlowEnd)
			{
				WorkFlow_UI.ioWorkFlow.open(this.ioObjects);
			}
			else
			{
				WorkFlow_UI.io.open(this.ioObjects);
			}
			return false;
		}
		else
		{
			//this should not happen, as after two have been clicked.
			//popup should appear, and after ioObjects should be cleared
			console.error('Both ioObjects set, they have not been cleared correctly');
		}
		
			
	},
	updateConnectionOrders : function()
	{
		if(this.standAloneWF == null)
		{
			this.mainWorkFlow.updateVerticesOrders();
		}
		else
		{
			this.standAloneWF.updateVerticesOrders();
		}
		this.draw();
	},
	/*
		Deletes the current view and renders the workflow that is sent through the parameter
		
		Argument: workflow = instance of workflow
	*/
	renderWorkFlow : function(workFlow)
	{
		if(this.standAloneWF == null)
		{
			//if the argument is a number then it is the index of a component which should be rendered
			workFlow = _.isNumber(workFlow) ? this.mainWorkFlow.components[workFlow] : workFlow;
			//need to save the index of the render workflow, as thsi will need to overwritten
			this.standAloneIndex = this.mainWorkFlow.getIndexOfObject(this.mainWorkFlow.components,workFlow);
			//clear the stage so it is blank
			this.clear();
			this.removeChildren();
			this.setIOMode(false);
			this.standAloneWF = workFlow;
			this.add(this.standAloneWF);
			this.standAloneWF.setType(Kinetic.WorkFlowType.standAlone);
			//create bin for lower layer
			this.renderRubbishBin();
			this.standAloneWF.updateAllVertices();
			WorkFlow_UI.toolbox.changeToolBoxTitle('<a onclick="layer.moveUp()">' + this.mainWorkFlow.getTitle() + '</a> >> ' + this.standAloneWF.getTitle());
			this.draw();
		}
		else
		{
			this.moveUp();
			this.renderWorkFlow(workflow);
		}
	},
	/*
		Adds an element to the current workflow, whether it is the main workflow or the current workflow that is rendered
	*/
	addElement : function (el)
	{
		//need to return the index, its used for adding a new workflow
		var returnIndex;
		if(this.standAloneWF == null)
		{
			returnIndex = this.mainWorkFlow.addElements([el]);
		}
		else
		{
			//add the element to the standalone workflow, send it as an array
			this.standAloneWF.addElements([el]);
			returnIndex = this.standAloneWF.getLastComponentIndex();
			
		}
		//setup IO Mode so this new element will be clickable
		if(this.ioMode == true)
		{
			this.setIOMode(false);
			this.setIOMode(true);
		}
		WorkFlow_UI.toolbox.checkWhatNext();
		//redraw the layer
		this.draw();
		return returnIndex;
	},
	/*
		Deletes an element to the current workflow, whether it is the main workflow or the current workflow that is rendered
	*/
	deleteElement : function (el)
	{
		if(this.standAloneWF == null)
		{
			//if the argument is a number then it is the index of a component which should be rendered
			this.mainWorkFlow.deleteElement(el);
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
	/*
		Moves up from the current rendered workflow to the main workflow, 
		if the current workflow is not the main workflow
	*/
	moveUp : function ()
	{
		if(this.standAloneWF != null)
		{
			this.standAloneWF.setType(Kinetic.WorkFlowType.nested);
			//overwrite the old workflow in the mainWorkflow
			this.mainWorkFlow.components[this.standAloneIndex] = this.standAloneWF;
			//now clear the layer so all components can be rendered
			this.standAloneWF.disconnectAllVertices();
			this.clear();
			this.removeChildren();
			this.standAloneWF.reDraw();
			this.setIOMode(false);
			this.standAloneWF = null;
			this.standAloneIndex = -1;
			this.add(this.mainWorkFlow);
			this.setIOMode(false);
			
			this.reDrawLayer();
			
			//render rubbish bin for the top layer
			this.renderRubbishBin();

			this.updateConnectionOrders();
			WorkFlow_UI.toolbox.changeToolBoxTitle('<a onclick="layer.moveUp()">' + this.mainWorkFlow.getTitle() + '</a>');

		}
	},
	/*
		Calls the setIOMode on the current workflow
	*/
	setUpIOMode : function ()
	{
		this.ioObjects = this.ioMode == false ? {input:null,output:null} : this.ioObjects;
		var html = this.ioMode == false ? 'Toggle Input/Output Mode - Off' : 'Toggle Input/Output Mode - On';
		$("#io").html(html);
			
		if(this.standAloneWF == null)
		{
			//all currentEls need to be clickable
			this.mainWorkFlow.setIOMode(this.ioMode);
		}
		else
		{
			this.standAloneWF.setIOMode(this.ioMode);
		}
		this.draw();
	},
	/*
		Sets ioObjects variable to null and set stroke of previously clicked objects to the default (black)
	*/
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
	/*
		Clears layer of all components and renders rubbish bin
	*/
	clearLayer : function ()
	{
		this.clear();
		this.removeChildren();
		this.renderRubbishBin();
	},
	/*
		Redraws the current workflow
	*/
	reDrawLayer : function ()
	{
		if(this.standAloneWF == null)
		{
			this.mainWorkFlow.reDraw();
		}
		else
		{
			this.standAloneWF.reDraw();
		}
		this.draw();
	},
	lineIntersections : function (lineXY)
	{
		
		this.getStage().getIntersection()
	},
	/*
		Creates a workflow using workflow.js
		
		Returns that workflow.js workflow
	*/
	createWorkFlow : function()
	{
		/*var mainWorkFlow = new UncertWeb.Workflow();
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
		}*/
		
		return this.mainWorkFlow.publish();
		
		
	},
	/*
		Publishes to the CaaS after a workflow has been created calling createWorkFlow
	*/
	publishWorkFlow : function()
	{
		 console.debug(UncertWeb.Encode.asBPMN(this.createWorkFlow()));
		 UncertWeb.CaaS.publish(this.createWorkFlow(),this.mainWorkFlow.brokerProperties)
	}
	
	
};
	
Kinetic.GlobalObject.extend(Kinetic.WorkFlowLayer, Kinetic.Layer);