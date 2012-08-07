var WorkFlow_UI = {};
var idCount = 100;
WorkFlow_UI.orderComponents =
{
		currentOrder : [],
		open : function ()
		{
			//get the current elements from layer
			currentOrder = layer.getComponents(false);
			$('#sortable').empty();
			//display the draggable components
			this.displayDraggableItems()
			
			
			$(function() {
				$( "#sortable" ).sortable({
					placeholder: "ui-state-highlight",
					start: function()
					{
						//remove droppable event when dragging the toolbox
						var con = $('#container');
			          	con.droppable({
					              drop: function(el,ui) {
			                        	
			                    }
						});
					},
					drag : function()
					{
						$('#toolbox').css(
						{
							opacity:0.6
						});
					},
					stop: function()
					{
						var con = $('#container');
						con.droppable({
				              drop: function(el,ui) {
		                        	WorkFlow_UI.search.doDrop(el,ui,layer)
		                    }
		               	});
		               	WorkFlow_UI.orderComponents.updateOrder();
		               	//set up connections
		               	layer.updateConnectionOrders();
					}
				});
				$( "#sortable" ).disableSelection();
			});
			
			$('#orderComponents').modal
			({
	    		backdrop: true,
	   			keyboard: true
			}).css
			({
				'overflow-y':'auto',
				'max-height':'90%',
	    		width: 'auto',
	    		'margin-left': function () {
	        		return -($(this).width() / 2);
	   		 	}
			});
			$('#orderComponents').modal('show');
		},
		displayDraggableItems : function()
		{
			_.each(currentOrder, function(item)
			{
				$("#sortable").append('<li class="ui-state-default" id="' + item._id + '">' + item.brokerProperties.name + '</li>');
			});	
		},
		updateOrder : function ()
		{
			var currentPos = $("#sortable").sortable("toArray");
			layer.updateComponentOrder(currentPos);
		}
};
WorkFlow_UI.search =
{
		brokerInfo: new Array(),
        doSearch : function()
        {
        	$("#searchResults").empty();
        	var searchTerm = $('#search').val();
        	var target = $("#searchResults");
        	
        	var opts = {
			  lines: 13, // The number of lines to draw
			  length: 5, // The length of each line
			  width: 4, // The line thickness
			  radius: 10, // The radius of the inner circle
			  rotate: 0, // The rotation offset
			  color: '#000', // #rgb or #rrggbb
			  speed: 1, // Rounds per second
			  trail: 60, // Afterglow percentage
			  shadow: false, // Whether to render a shadow
			  hwaccel: false, // Whether to use hardware acceleration
			  className: 'spinner', // The CSS class to assign to the spinner
			  zIndex: 2e9, // The z-index (defaults to 2000000000)
			  top: 'auto', // Top position relative to parent in px
			  left: 'auto' // Left position relative to parent in px
			};
			//var spinner = new Spinner(opts).spin();
			//target.append(spinner.el);
			
			var spinner = new Spinner(opts).spin(target[0]);
			
          	UncertWeb.broker.search(searchTerm,
		        function(data)
		        {
		        	brokerInfo = data;
		        	spinner.stop();
		        	
		        	//output results of the search
		        	_.each(brokerInfo.results,function(res)
		        	{
			        	
			        	$("#searchResults").append('<li class="draggable" rel="popover" data-content="' + res.description + '" data-original-title="' + res.name + '"id=' + _.indexOf(brokerInfo.results, res) + '>' + res.name + '</li>');    	
		        	});
		        	
		        	//enable the popovers that give the info for the component
		        	$(function() {
	    				$('li[rel="popover"]').popover();
	    			});
		        	
		        	//set the options for the draggable component
		        	$('.draggable').draggable({
			        	revert: true,
			        	 
						start: function() {
							//on drag start, we want to remove the popover
							//this gets in the way when dragging
							$("li[rel=popover]").popover('hide');
							$("li[rel=popover]").popover('disable');
						},
						stop: function(){
							$("li[rel=popover]").popover('enable');
						}
					});
					//if there are no results, tell the user
		        	if(brokerInfo.results.length == 0)
				        {
				        	spinner.stop();
					        $("#searchResults").html('<p>No Results</p>');
				        }
		        	
		        },
		        function (data)
		        {
		        	 $("#searchResults").append('<p>An Error has occured</p>');
		        }
	        );
	        
	        
	         
		   

	    },
	    doDrop : function (ev,ui,layer)
	    {
	    	//when an item has been dropped, we can then add an element to the layer
	    	 opts = arguments;
             var draggedID = ui.draggable.attr("id");
             var resultOb = brokerInfo.results[draggedID];
             
             offset = layer.getStage()._getContentPosition();
                //get search meta data using this id
                var s = layer.getStage();
             var mousePos = s.getMousePosition();
                var mouseX = (ev.clientX + offset.left + window.pageXOffset);
                var mouseY = (ev.clientY + offset.top + window.pageYOffset);
                var wFlowEle = new Kinetic.WorkFlowComponent({text:'',x:mouseX,y:mouseY,draggable:true,layer:layer,type:"component",brokerProperties:resultOb});
                layer.addElement(wFlowEle);
                
		    
	    }
};
WorkFlow_UI.addWF =
{
	open : function()
	{
		
		$('#newWFModal').modal
		({
    		backdrop: true,
   			keyboard: true
		}).css
		({
			'overflow-y':'auto',
			'max-height':'90%',
    		width: 'auto',
    		'margin-left': function () {
        		return -($(this).width() / 2);
   		 	}
		});
		$('#newWFModal').modal('show');
		$('#titleWF').empty();
		$('#abstractWF').empty();	
	},
	add : function()
	{
		//check that the required fields have been entered
		if($('#titleWF').val() == '')
		{
			$('#titleGroup').append('<p class="help-block">Enter title of Workflow</p>');
			$('#titleGroup').attr("class","control-group error");
			return false;
		}
		if($('#abstractWF').val() == '')
		{
			$('#abstractGroup').append('<p class="help-block">Enter abstract for Workflow</p>');
			$('#abstractGroup').attr("class","control-group error");
			return false;
		}
		config = {
			name:$('#titleWF').val(),
			description:$('#abstractGroup').val(),
			annotation:''
		}
		//create workflow from
		newWFlow = new Kinetic.WorkFlow({text:$('#titleWF').val(),brokerProperties:config,x:100,y:10,draggable:true,layer:layer,type:Kinetic.WorkFlowType.nested});
		var index = layer.addElement(newWFlow);
		//move down a layer to start editing this workflow
		layer.renderWorkFlow(index);
		
		
		//close the modal
		$('#newWFModal').modal('hide');
		
		
		//remove the errors from the form
		$('#titleGroup').attr("class","control-group");
		$('#abstractGroup').attr("class","control-group");
	}
};
WorkFlow_UI.io =
{
		IOs: {},
		noRows: 1,
		components : {},
		currentIOs : {},
		open : function(IO)
		{
			IOs = {inputs:IO.input.getInputs(),outputs:IO.output.getOutputs()};
			if(this.checkForIO() == false){return false;}
			components = IO;
			currentIOs = this.getAllCurrentIOs();
			//clear modal contents, from previous opening
			 $('#inputDesc').empty();
			 $('#outputDesc').empty();
			 $('#dropdowns').empty();
			noRows = 1;
			this.outputCurrentIOs();
			//open modal and populate with IO
			$('#ioModal').modal('show');
			$('#ioModal').modal
			({
        		backdrop: true,
       			 keyboard: true
    		}).css
    		({
    			'overflow-y':'auto',
    			'max-height':'90%',
    			'max-width' : '65%',
        		width: 'auto',
        		'margin-left': function () {
            		return -($(this).width() / 2);
       		 	}
   			 });
   			 
   			 
   			 
   			 //display the descriptions of the 2 items clicked
   			 if(IO.input instanceof Kinetic.WorkFlow)
   			 {
	   			 //set the type
	   			 $('#inputHeading').html('To: ' + IO.input.title);
	   			 $('#inputDesc').html('<h4>Title:</h4> ' + IO.input.title);
	   			 $('#inputDesc').append('<h4>Type:</h4> Nested Workflow');
	   			 $('#inputDesc').append('<h4>Description</h4>');
	   			 $('#inputDesc').append('<p>This is the Description, it will be added by the user when they choose to create a workflow</p>');
   			 }
   			 else if (IO.input instanceof Kinetic.WorkFlowComponent)
   			 {
	   			 //set the type
	   			 $('#inputHeading').html('To: ' + IO.input.title);
	   			 $('#inputDesc').html('<h4>Title:</h4> ' + IO.input.title);
	   			 $('#inputDesc').append('<h4>Type:</h4> Component');
	   			 $('#inputDesc').append('<h4>Description</h4>');
	   			 $('#inputDesc').append('<p>' + IO.input.brokerProperties.description +'</p>');

	   			 
   			 }
   			 if(IO.output instanceof Kinetic.WorkFlow)
   			 {
	   			 //set the type
	   			 $('#outputHeading').html('From: ' + IO.output.title);
	   			 $('#outputDesc').append('<h4>Title:</h4> ' + IO.output.title);
	   			 $('#outputDesc').append('<h4>Type:</h4> Nested Workflow');
	   			 $('#outputDesc').append('<h4>Description</h4>');
	   			 $('#outputDesc').append('<p>This is the Description, it will be added by the user when they choose to create a workflow</p>');
	   			 
   			 }
   			 else if (IO.output instanceof Kinetic.WorkFlowComponent)
   			 {
	   			 //set the type
	   			 $('#outputHeading').html('From: ' + IO.output.title);
	   			 $('#outputDesc').append('<h4>Title:</h4> ' + IO.output.title);
	   			 $('#outputDesc').append('<h4>Type:</h4> Component');
	   			 $('#outputDesc').append('<h4>Description</h4>');
	   			 $('#outputDesc').append('<p>' + IO.output.brokerProperties.description +'</p>');

	   			 
   			 }
   			 
   			//$('#inputCollapse').collapse('show');
   			//$('#outputCollapse').collapse('show');
   			
   			 //need to display, previous connections that are set
   			 
   			 //display new section to be set
   			 this.displayIO();
			
			
		},
		checkForIO : function()
		{
			if(IOs.outputs.length == 0)
			{
				alert('ERROR! - You need to set Outputs for this WorkFlow.\n Double Click to Edit');
				$('#ioModal').modal('hide');
				return false;
			}
			else if(IOs.inputs.length == 0)
			{
				alert('ERROR! - You need to set Inputs for this WorkFlow.\n Double Click to Edit');
				$('#ioModal').modal('hide');
				return false;
			}
			return true;
		},
		getAllCurrentIOs : function ()
		{
			var currentIn = new Array();
			var currentOut = new Array();
			//get inputs connections based on the output
			currentIn = components.input.getInputConnections(components.output);
			
			currentOut = components.output.getOutputConnections(components.input);
			
			//sanity check, in and out should be the same
			if(!(_.isEqual(currentIn,currentOut)))
			{
				console.error('CurrentIns and outs not the same');
			}
			return currentOut;
		},
		outputCurrentIOs : function()
		{
			//loop through currentIOs
			//each time call displayIO, then modify the row so
			//the correct option is selected and alert-success and delete button is set
			var that = this;
			_.each(currentIOs,
				function(currentIO)
				{
					that.displayIO();
					$("#inputs_" + (noRows-1) + " option[value=" + currentIO.input.inputIO.id + "]").attr('selected', 'selected');
					$("#outputs_" + (noRows-1) + " option[value=" + currentIO.output.outputIO.id + "]").attr('selected', 'selected');
					//$('#inputs_' + noRows-1).val(currentIO.input.inputIO.id).attrs('selected',true);
					//$('#outputs_' + noRows-1).val(currentIO.output.outputIO.id).attrs('selected',true);
					that.disableRow(noRows-1);
					//change the button to delete, to give the ability to delete the connection
					var button = $('#button_' + (noRows-1))
					button.html('Delete');
					button.attr('onclick', 'WorkFlow_UI.io.deleteIO(' + (noRows-1) + ')');
					$('#row_' + (noRows-1)).attr('class','row alert alert-success');
					$('#rowAlertHeading_' + (noRows-1)).empty();

				});	
		},
		displayIO : function()
		{
			//display outputs
			var form = $('<form class="form-vertical"></form>');
			var row = $(' <div class="row alert fade in" id="row_' + noRows +'"></div>')
			row.append('<h4 class="alert-heading" id=rowAlertHeading_' + noRows + '></h4>');
			var spanOutputs = $('<div class="span4"></div>');
			var group = $('<div class="control-group"></div>');
			var controls = $('<div class="controls"></div>');
			var select = $(' <select id="outputs_' + noRows + '" onchange="WorkFlow_UI.io.displayOutputDetails(' + noRows + ',this);"></select>');
			_.each(IOs.outputs,function(oIO)
			{
				//data attribute will store the actual ioObject from the broker
				//the value in the select will be the title of the ioObject
				select.append('<option value=' + oIO.id + ' data-ioObjectid=' + oIO.id + '>' + oIO.name + '</option>');
				
			});     
			
			controls.append(select);
			group.append(controls);
			//group.append('<button class="btn btn-primary" onclick="WorkFlow_UI.io.setIO(' + noRows + ')" href="#">Set</button>')
			spanOutputs.append(group);
			spanOutputs.append('<div id="outputDetails_' + noRows + '"></div>');
			row.append(spanOutputs);
			  
			
			
			  
			
			
			//output inputs
			
			var spanInputs = $('<div class="span4"></div>');
			var group = $('<div class="control-group"></div>');
			var controls = $('<div class="controls"></div>');
			var select = $(' <select id="inputs_' + noRows + '" onchange="WorkFlow_UI.io.displayInputDetails(' + noRows + ',this);"></select>');
			
			_.each(IOs.inputs,function(iIO)
			{
				//data attribute will store the actual ioObject from the broker
				//the value in the select will be the title of the ioObject
				select.append('<option value=' + iIO.id + ' data-ioObjectid=' + iIO.id + '>' + iIO.name + '</option>');
				
			});
			
			controls.append(select);
			group.append(controls);
			spanInputs.append(group);
			spanInputs.append('<div id="inputDetails_' + noRows + '"></div>');
			row.append(spanInputs);
			row.append('<div class="span1"><button id="button_' + noRows + '" class="btn btn-primary" onclick="WorkFlow_UI.io.setIO(' + noRows + ')" href="#">Set</button></div>');	
			$('#dropdowns').append(row);
			$(".alert").alert()
			
			noRows++;      
			             
			        
		
			
		},
		displayInputDetails : function(rowDetail,el)
		{
			$('#inputCollapse').collapse('hide');
   			$('#outputCollapse').collapse('hide');
			var select = $('#inputs_' + rowDetail).find(":selected");
			var id =  select.data('ioobjectid');
			//have the id, now need to find the object using the input object
			ioObject = components.input.getIOObject(id);
			$('#inputDetails_' + rowDetail).html(ioObject.description);
			
		},
		displayOutputDetails : function(rowDetail,el)
		{
			var select = $('#outputs_' + rowDetail).find(":selected");
			var id =  select.data('ioobjectid');
			//have the id, now need to find the object using the input object
			ioObject = components.output.getIOObject(id);
			$('#outputDetails_' + rowDetail).html(ioObject.description);
			
		},
		clearDetails : function ()
		{
			for(var r = 0; r<noRows;r++)
			{
				$('#outputDetails_' + r).empty();
				$('#inputDetails_' + r).empty();
			}
			
		},
		disableRow : function (row)
		{
			$('#inputs_' + row).attr("disabled", "disabled");
			$('#outputs_' + row).attr("disabled", "disabled");
		},
		setIO : function(row)
		{
			//get the input from the select
			var select = $('#inputs_' + row).find(":selected");
			var inputObId =  select.data('ioobjectid');
			//get the output from the select
			var select = $('#outputs_' + row).find(":selected");
			var outputObId =  select.data('ioobjectid');

			//call connectTo on the output
			//this will include object of: input object, input IOObject and output IOObject
			var resultCon = components.output.connectTo(
			{
				input:{obj:components.input,inputIO:components.input.getIOObject(inputObId)},
				output:{obj:components.output,outputIO:components.output.getIOObject(outputObId)}
			});
			
			
			if(resultCon)
			{
				$('#row_' + row).attr('class','row alert alert-success');
				$('#rowAlertHeading_' + row).empty();
				$(".alert").alert()
				//display new IO, to map new IO
				this.displayIO();
				this.clearDetails();
				//the row, that has been set
				this.disableRow(row);
				//change the button to delete, to give the ability to delete the connection
				var button = $('#button_' + row)
				button.html('Delete');
				button.attr('onclick', 'WorkFlow_UI.io.deleteIO(' + row + ')');

			}
			else
			{
				//this has already been mapped, display message
				$('#row_' + row).attr('class','row alert alert-error');
				$(".alert").alert()
				$('#rowAlertHeading_' + row).html('<h4>Connection already Defined</h4><br>');
			}
			
		},
		deleteIO : function(row)
		{
			//get the input from the select
			var select = $('#inputs_' + row).find(":selected");
			var inputObId =  select.data('ioobjectid');
			//get the output from the select
			var select = $('#outputs_' + row).find(":selected");
			var outputObId =  select.data('ioobjectid');
			
			//delete the connection from the intput and output
			var resultCon = components.output.disconnect(
			{
				input:{obj:components.input,inputIO:components.input.getIOObject(inputObId)},
				output:{obj:components.output,outputIO:components.output.getIOObject(outputObId)}
			});
			
			//update the currentIOs
			//remove the row, do we need to change all the IDS?
			$('#row_' + row).alert('close')
			//$('#row_' + row).remove();
		}

};
WorkFlow_UI.ioWorkFlow =
{
	
		IOs: [],
		noRows: 1,
		components : {},
		currentIOs : {},
		workFlow : {},
		open : function(IO)
		{
			components = IO;
			
			this.workFlow = this.getStartEndComponent().obj.parent;
			var WFName = this.workFlow.brokerProperties.name;
			if(this.getStartEndComponent().type == "start")
			{
				$('#ioWorkFlowHeader').html('Set inputs for Workflow - ' + WFName);
				IOs = this.getStartEndComponent().com.getInputs();
			}
			else
			{
				$('#ioWorkFlowHeader').html('Set outputs for Workflow - ' + WFName);
				IOs = this.getStartEndComponent().com.getOutputs();
			}
			if(this.checkForIO() == false){return false;}
			currentIOs = this.getAllCurrentIOs();
			noRows = 1;
			$('#ioDropdownWF').empty();
			this.outputCurrentIOs();
			//open modal and populate with IO
			$('#ioWorkFlowModal').modal('show');
			$('#ioWorkFlowModal').modal
			({
        		backdrop: true,
       			 keyboard: true
    		}).css
    		({
    			'overflow-y':'auto',
    			'max-height':'90%',
    			'max-width' : '65%',
        		width: 'auto',
        		'margin-left': function () {
            		return -($(this).width() / 2);
       		 	}
   			 });
   			 //display new section to be set
   			 this.displayIO();
			
			
		},
		checkForIO : function()
		{
			if(IOs.length == 0)
			{
				alert('ERROR! - You need to set Outputs for this WorkFlow.\nDouble Click to Edit');
				$('#ioModal').modal('hide');
				return false;
			}
			return true;
		},
		getAllCurrentIOs : function ()
		{
			var current = [];
			
			//need to get the IOs already set for the workflow for this component
			if(this.getStartEndComponent().type == "start")
			{
				//get inputs for the workflow, that are assigned from the component
				current = this.getStartEndComponent().obj.parent.getInputs(this.getStartEndComponent().com);
			}
			else
			{
				//get outputs for the workflow, that are assigned from the component
				current = this.getStartEndComponent().obj.parent.getOutputs(this.getStartEndComponent().com);
			}
			
			return current;
		},
		outputCurrentIOs : function()
		{
			//loop through currentIOs
			//each time call displayIO, then modify the row so
			//the correct option is selected and alert-success and delete button is set
			var self = this;
			_.each(currentIOs,
				function(currentIO)
				{
					self.displayIO();
					$("#ios_" + (noRows-1) + " option[value=" + currentIO.id + "]").attr('selected', 'selected');
					self.disableRow(noRows-1);
					//change the button to delete, to give the ability to delete the connection
					var button = $('#buttonio_' + (noRows-1))
					button.html('Delete');
					button.attr('onclick', 'WorkFlow_UI.ioWorkFlow.deleteIO(' + (noRows-1) + ')');
					$('#rowio_' + (noRows-1)).attr('class','row alert alert-success');
					$('#rowAlertHeadingio_' + (noRows-1)).empty();

				});	
		},
		getStartEndComponent : function()
		{
			if(components.input instanceof Kinetic.WorkFlowStart) 
			{
				return {obj:components.input, type:"start",com:components.output};
			}
			else if (components.output instanceof Kinetic.WorkFlowStart)
			{
				return {obj:components.output, type:"start",com:components.input};
			}
			else if (components.output instanceof Kinetic.WorkFlowEnd)
			{
				return {obj:components.output, type:"end",com:components.input};
			}
			else if(components.input instanceof Kinetic.WorkFlowEnd)
			{
				return {obj:components.input, type:"end", com:components.output};
			}
			
		},
		displayIO : function()
		{
			//display outputs
			var form = $('<form class="form-vertical"></form>');
			var row = $(' <div class="row alert fade in" id="rowio_' + noRows +'"></div>')
			row.append('<h4 class="alert-heading" id=rowAlertHeadingio_' + noRows + '></h4>');
			var spanOutputs = $('<div class="span4"></div>');
			var group = $('<div class="control-group"></div>');
			var controls = $('<div class="controls"></div>');
			var select = $(' <select id="ios_' + noRows + '"></select>');
			
			_.each(IOs,function(oIO)
			{
				//data attribute will store the actual ioObject from the broker
				//the value in the select will be the title of the ioObject
				select.append('<option value=' + oIO.id + ' data-ioObjectid=' + oIO.id + '>' + oIO.name + '</option>');
				
			});     
			
			controls.append(select);
			group.append(controls);
			//group.append('<button class="btn btn-primary" onclick="WorkFlow_UI.io.setIO(' + noRows + ')" href="#">Set</button>')
			spanOutputs.append(group);
			spanOutputs.append('<div id="outputDetails_' + noRows + '"></div>');
			row.append(spanOutputs);
			row.append('<div class="span1"><button id="buttonio_' + noRows + '" class="btn btn-primary" onclick="WorkFlow_UI.ioWorkFlow.setIO(' + noRows + ')" href="#">Set</button></div>');	
			$('#ioDropdownWF').append(row);
			$(".alert").alert()
			
			noRows++;      
			             
			        
		
			
		},
		disableRow : function (row)
		{
			$('#ios_' + row).attr("disabled", "disabled");
		},
		setIO : function(row)
		{
			//get the input from the select
			var select = $('#ios_' + row).find(":selected");
			var inputObId =  select.data('ioobjectid');
			//create the new IO object for workflow
			var com = this.getStartEndComponent().com;
			var comIO = com.getIOObject(inputObId);
			var newIO = {com:com,id:comIO.id,name:comIO.name};
			//we now need to add the new IO to the workflow
			if(this.getStartEndComponent().type == "start")
			{
				var resultCon = this.getStartEndComponent().obj.parent.addInput(newIO);
			}
			else
			{
				var resultCon = this.getStartEndComponent().obj.parent.addOutput(newIO);
			}
			
			if(resultCon)
			{
				$('#rowio_' + row).attr('class','row alert alert-success');
				$('#rowAlertHeadingio_' + row).empty();
				$(".alert").alert()
				//display new IO, to map new IO
				this.displayIO();
				//the row, that has been set
				this.disableRow(row);
				//change the button to delete, to give the ability to delete the connection
				var button = $('#buttonio_' + row)
				button.html('Delete');
				button.attr('onclick', 'WorkFlow_UI.ioWorkFlow.deleteIO(' + row + ')');

			}
			else
			{
				//this has already been mapped, display message
				$('#rowio_' + row).attr('class','row alert alert-error');
				$(".alert").alert()
				$('#rowAlertHeadingio_' + row).html('<h4>Connection already Defined</h4><br>');
			}
			
		},
		deleteIO : function(row)
		{
			//get the input from the select
			var select = $('#ios_' + row).find(":selected");
			var inputObId =  select.data('ioobjectid');
			
			var com = this.getStartEndComponent().com;
			var comIO = com.getIOObject(inputObId);
			var newIO = {com:com,id:comIO.id,name:comIO.name};
			//delete the connection from the intput and output
			if(this.getStartEndComponent().type == "start")
			{
				var resultCon = this.getStartEndComponent().obj.parent.deleteInput(newIO);
			}
			else
			{
				var resultCon = this.getStartEndComponent().obj.parent.deleteOutput(newIO);
			}
			
			//update the currentIOs
			//remove the row, do we need to change all the IDS?
			$('#row_' + row).alert('close')
			//$('#row_' + row).remove();
		}

};

