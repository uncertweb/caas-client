// Lets keep the global namespace tidy by wrapping everything
// in a self-invoking anonymous function.
(function ($, global) {

  // Utility function for type checking
  var _typeOf = function (obj) {
        return Object.prototype.toString.call(obj);
      };

  // Set the unique ID to the current timestamp
  var _currID = +new Date();

  // Core functions
  // --------------

  var UncertWeb = {
    // Check whether an object is an Array
    isArray: function (obj) {
      return _typeOf(obj) === '[object Array]';
    },

    // Check whether an object is an Object
    isObject: function (obj) {
      return _typeOf(obj) === '[object Object]';
    },

    // Check whether an object is a Function
    isFunction: function (obj) {
      return _typeOf(obj) === '[object Function]';
    },

    // Check whether an object is a Component
    isComponent: function (obj) {
      return obj instanceof this.Component;
    },

    // Check whether an object is a Workflow
    isWorkflow: function (obj) {
      return obj instanceof this.Workflow;
    },

    // Check whether an object is a Number
    isNumber: function (obj) {
        return _typeOf(obj) === '[object Number]';
    },

    // Check whether an object is a String
    isString: function (obj) {
      return _typeOf(obj) === '[object String]';
    },

    // Generate a unique ID
    uid: function () {
      _currID += 1;
      return '_'+_currID;
    }
  };

  // UncertWeb options
  UncertWeb.options = {
    iso_broker_url: 'lib/iso_broker.php',
    broker_url: 'lib/broker.php',
    caas_url:   'lib/caas.php',
    caas_delete_url: 'lib/caas_delete.php',
    // Setup default search options for the broker.
    //
    //- **si**: Start index
    //- **st**: Search term
    //- **bbox**: Bounding box
    //- **rel**: Spatial relationship, e.g. contains, intersects
    //- **ts**: time start for temporal queries
    //- **te**: time end for temporal queries
    //- **ct**: Count - number of results returned
    //- **loc**: Location string, put through a geocoder before querying
    search_config: {
      si: 1,
      st: '',
      bbox: '',
      rel: '',
      ts: '',
      te: '',
      ct: 1000,
      loc: '',
      outputFormat: 'application/atom+xml'
    }
  };

  UncertWeb.namespaces = {
    GCO: 'http://www.isotc211.org/2005/gco',
    BPMN: 'http://www.omg.org/spec/BPMN/20100524/MODEL',
    BPMNDI: 'http://www.omg.org/spec/BPMN/20100524/DI',
    DC: 'http://www.omg.org/spec/DD/20100524/DC',
    DI: 'http://www.omg.org/spec/DD/20100524/DI',
    G: 'http://www.jboss.org/drools/flow/gpd',
    TNS: 'http://www.jboss.org/drools',
    XSD: 'http://www.w3.org/2001/XMLSchema',
    XSI: 'http://www.w3.org/2001/XMLSchema-instance',
    MVEL: 'http://www.mvel.org/2.0',
    JAVA: 'http://www.java.com/javaTypes',
    GMD: 'http://www.isotc211.org/2005/gmd',
    CAAS: 'http://essi.iia.cnr.it/caas/1.0'
  };


  // Broker module
  // -------------

  // Helper function to create IO objects from the broker results
  // Currently mocked up as no IO data is present in the broker
  function parseIO (xml) {

    return [{
      id: UncertWeb.uid(),
      name: "IO 1",
      description: "IO number 1"
    }, {
      id: UncertWeb.uid(),
      name: "IO 2",
      description: "IO number 2"
    }];
  }

  // Create the `UncertWeb.broker` module.
  UncertWeb.broker = {
    // Search the broker for the specified `keywords`.
    // Handle the success via inline callbacks or via the returned
    // deferred object.
    search: function (keywords) {
      var dfd = $.Deferred(),
          results = [],
          $data,
          entry = {},
          start = +new Date(),
          result_object = {},
          base_url = UncertWeb.options.broker_url,
          index = 1,
          opts,
          success,
          fail;

      // Check for options
      if(UncertWeb.isObject(arguments[index])) {
        opts = arguments[index];
        index += 1;
      }

      success = arguments[index];
      fail = arguments[index+1];

      var config = $.extend({}, UncertWeb.options.search_config, opts);

      // Set the keywords in the search config
      config.st = keywords;

      // Make an AJAX request to the proxy service with the configuration options
      $.ajax({
        url: base_url,
        data: config,
        async: true
        // When the AJAX query responds
      }).done(function (data) {
        $data = $(data);
        // Map the XML data into an array of JSON objects
        results = $.map($data.find('entry'), function (elem) {
          var $this = $(elem);
          // Skip any elements without annotations as we cannot use them in the system.
          if($this.find('category[scheme="urn:X-GI-caas:component:taxonomy"]').length === 0) {
            return null;
          }
          // Return a JSON representation of the XML `entry` element
          //
          //- **id**: Unique ID, not to be confused with the internal IDs used by us.
          //- **title**: Human readable title.
          //- **endpoint**: URL of component, although this is rarely set so shouldn't be relied on.
          //- **keywords**: Array of words describing the component.
          //- **updated**: Date and time that the component was last updated in the broker.
          //- **summary**: Human readable description of the component.
          //- **serviceType**: Type of component (data access, model etc).
          //- **annotation**: CaaS annotation of this component.
          return {
            id: $this.find('id').text(),
            name: $this.find('title').text(),
            endpoint: $this.find('endpoint').text(),
            keywords: $.map($this.find('[term="keywords"]'), function (elem) {
              return $(elem).attr('label');
            }),
            updated: $this.find('updated').text(),
            description: $this.find('summary').text(),
            serviceType: $this.find('category[term="serviceType"]').attr('label'),
            annotation: $this.find('category[scheme="urn:X-GI-caas:component:taxonomy"]').attr('label'),
            parentID: $this.find('parentID').text()
          };
        });
        // Create a wrapper object for the query results and including:
        //
        //- **num_results**: Number of results returned by the query.
        //- **completed_in**: The time taken, in seconds, to execute the search.
        //- **query**: The actual query sent to the broker.
        //- **results**: An array of results objects detailed above.
        result_object = {
          num_results: results.length,
          completed_in: (+new Date() - start) / 1000,
          query: $.param(config),
          results: results
        };
        // Once we have finished converting the XML to JSON, resolve the deferred object.
        dfd.resolve(result_object);
        // If an inline callback function was provided, fire it now.
        if(UncertWeb.isFunction(success)) {
          success.call(this, result_object, "success");
        }
        // If the AJAX request was unsuccessful
      }).fail(function () {
        // Log the error to the console
        console.error('Search failed ' + arguments[0].responseText);
        // If an inline callback was provided, fire it now
        if(UncertWeb.isFunction(fail)) {
          fail.apply(this, arguments);
        }
      });

      // Return a deferred object straight away so the user is not blocked.
      return dfd;
    },

    // Alias function for `UncertWeb.broker.search('')` that returns all components in the broker.
    all: function (success, failure) {
      return this.search('', success, failure);
    },

    // ISO broker module
    // -----------------

    // Get the full details of the component from the ISO broker
    getDetails: function(id) {
      var dfd = $.Deferred();

      $.ajax({
        url: UncertWeb.options.iso_broker_url,
        data: {
          id: id
        }
      }).done(function (xml) {
        if(xml === null) {
          dfd.reject({
            message: "No component exists with the ID: " + id
          });
          return;
        }

        var $xml = $(xml.firstChild),
            component = {};


        component['id'] = $xml.find('fileIdentifier').children().text();

        var $idInfo = $xml.find('identificationInfo');

        component['name'] = $idInfo.find('citation').children().children().children().text();

        var $abstract = $($idInfo.find('abstract'));
        component['description'] = $abstract.find('CharacterString').text();

        var $keywords = $($idInfo.find('keyword'));
        component['keywords'] = [];

        $.each($keywords, function (elem) {
          var keyword = $(this).find('CharacterString').text();
          // If the keyword contains a colon use it as the CaaS annotation
          if(keyword.match(/:/)) {
            component['annotation'] = keyword;
          }
          component['keywords'].push();
        });

        component['version'] = $($idInfo.find('serviceTypeVersion')).find('CharacterString').text();

        component['endpoint'] = $($xml.find('linkage')).find('URL').text();

        // IO
        var $parameters = $($idInfo.find('SV_Parameter'));
        component['inputs'] = [];
        component['outputs'] = [];

        $.each($parameters, function (elem) {
          var ioObject = {};
          var $param = $(this);
          var $nameDetails = $($param.find('name'));

          ioObject['name'] = $($nameDetails.find('aName')).find('CharacterString').text();
          ioObject['id'] = UncertWeb.uid();
          ioObject['dataType'] = $($nameDetails.find('TypeName')).find('CharacterString').text();
          ioObject['required'] = $($param.find('optionality')).find('CharacterString').text() == "Mandatory";
          ioObject['multiple'] = $($param.find('repeatability')).find('Boolean').text() == "true";


          var direction = $($param.find('direction')).find('SV_ParameterDirection').text();
          if(direction == "in") {
            component['inputs'].push(ioObject);
          } else {
            component['outputs'].push(ioObject);
          }
        });

        dfd.resolve(component);
      });

      return dfd;
    }
  };

  // Component module
  // ----------------

  // Helper functions to find a component based on an IO ID

  function _root () {
    var root = this;
    // find the top of the tree
    while (!(root.parent === window || root.parent === undefined)) {
      root = root.parent;
    }
    return root;
  }

  function searchComponent (component, id) {
    if (UncertWeb.isComponent(component)) {
      var arr = component._inputs.concat(component._outputs);
      for (i = 0; i < arr.length; i++) {
        if(arr[i].id == id) {
          return arr[i];
        }
      }
    }
  }

  function searchWorkflow (workflow, id) {
    for (var i = 0; i < workflow.length; i++) {
      if(UncertWeb.isComponent(workflow[i])) {
        result = searchComponent(workflow[i], id);
      } else {
        result = searchWorkflow(workflow[i], id);
      }
      if(result) {
        return result;
      }
    }
  }

  // Create the `UncertWeb.Component` module.
  UncertWeb.Component = function (opts) {
    opts = opts || {};
    // Setup public properties
    this.id = UncertWeb.uid();
    this.broker_id = opts.id;
    this.name = opts.name || "";
    this.description = opts.description || "";
    this.annotation = opts.annotation || "";

    this._inputs = opts.inputs || [];
    this._outputs = opts.outputs || [];
    this.connections = [];

    this.root = _root;

    // setup parent references in the IO objects
    var i;
    for (i = 0; i < this._inputs.length; i++) {
      this._inputs[i].component = this;
    }

    for (i = 0; i < this._outputs.length; i++) {
      this._outputs[i].component = this;
    }

    this.outputs = function (isConnected) {
      if(isConnected) {
        var _conns = this.connections,
            _res = [];
        for (var i = 0; i < _conns.length; i++) {
          if(_conns[i].output.component.id === this.id) {
            _res.push(_conns[i].output);
          }
        }
        return _res;
      }

      return this._outputs;
    };

    this.inputs = function (connected) {
      if(connected) {
        var _conns = this.connections,
            _res = [];
        for (var i = 0; i < _conns.length; i++) {
          if(_conns[i].input.component.id === this.id) {
            _res.push(_conns[i].input);
          }
        }
        return _res;
      }
      return this._inputs;
    };

    this.findConnection = function (io) {
      for (var i = 0; i < this.connections.length; i++) {
        if(this.connections[i].input == io || this.connections[i].output == io) {
          return this.connections[i];
        }
      }
    };

    this.connect = function (output, input) {
      output = UncertWeb.isObject(output) ? output : searchWorkflow(this.root(), output);
      input = UncertWeb.isObject(input) ? input : searchWorkflow(this.root(), input);

      var connection = {
        output: output,
        input: input
      };

      // Add connections to both sides
      input.component.connections.push(connection);
      output.component.connections.push(connection);
    };

    function removeConnection (conn) {
      var inputConnections = conn.input.component.connections,
          outputConnections = conn.output.component.connections;

      for (var i = inputConnections.length - 1; i >= 0; i--) {
        if(inputConnections[i] === conn) {
          inputConnections.splice(i,1);
          break;
        }
      }
      for (var j = outputConnections.length - 1; j >= 0; j--) {
        if (outputConnections[j] === conn) {
         outputConnections.splice(j,1);
        }
      }
    }

    // disconnect a component via a specified connection, or all connections
    // to a specified component
    this.disconnect = function (args) {
      var toRemove = [];

      if(UncertWeb.isComponent(args)) {
        toRemove = this.connectionsTo(args);
      } else if(UncertWeb.isObject(args)) {
        // remove this single connection
        toRemove.push(args);
      } else if(args === undefined) {
        // remove all connections
        toRemove = this.connections.slice();
      }

      for (var i = 0; i < toRemove.length; i++) {
        removeConnection(toRemove[i]);
      }
    };

    // returns all connection objects to a specified component
    this.connectionsTo = function (component) {
      var _connections = [];

      if(component === undefined || this === component) return _connections;

      for (var i = 0; i < this.connections.length; i++) {
        var conn = this.connections[i];
        if(conn.input.component.id === component.id ||
           conn.output.component.id === component.id) {
          _connections.push(conn);
        }
      }
      return _connections;
    };

    // Returns true if this component is linked to the component passed as args[0]
    // returns false otherwise
    this.connectedTo = function (componentID) {
      var i;
      if(arguments.length === 0) {
        // return array of connected components
        var _components = {};

        // get all components
        for(i = 0; i < this.connections.length; i++) {
          var _input = this.connections[i]['input']['component'],
              _output = this.connections[i]['output']['component'];
          _components[_input.id] = _input;
          _components[_output.id] = _output;
        }

        var results = [];
        // reindex array
        for (var key in _components) {
          if(key === this.id) continue;
          results.push(_components[key]);
        }

        return results;
      } else {
        var id = componentID.id || componentID;

        for (i = 0; i < this.connections.length; i++) {
          if(this.connections[i].input.component.id == id ||
             this.connections[i].output.component.id == id) {
            return true;
          }
        }
        return false;
      }
    };

  };


  // Workflow module
  // ---------------

  // Helper function that subscribes to the `workflow/update` event of child workflows and
  // propagates the event to the parent workflow. The result of this is that a user
  // only has to subscribe to the parent `workflow/update` event and will be informed even
  // when a child workflow is updated.
  wrapCallback = function (workflow) {
    workflow.subscribe('workflow/update', function (data) {
      this.publish('workflow/update', this);
    }, this);
  };

  // Create `UncertWeb.Workflow` module.
  UncertWeb.Workflow = function (opts) {
    // Length property to help mimic array behaviour.
    this.length = 0;

    // public properties
    this.id = opts === undefined ? UncertWeb.uid() : opts.id || UncertWeb.uid();
    this.iterations = opts === undefined ? undefined : opts.iterations;

    // Private properties
    var subscribers = {},
        iterations;

    // Publish an event occuring on this workflow.
    this.publish = function (event, data) {
      // If this particular event has no subscribers, return immediately.
      if(!subscribers[event]) {
        return this;
      }

      var i = 0,
          // number of subscribers to this event.
          length = subscribers[event].length,
          subscription,
          // Arguments array to pass to the callback function.
          args = this.slice.call(arguments, 1);

      // Find all subscribers to this event and fire their specified callback function.
      // Passing in `data` as a parameter.
      for( ; i < length; i += 1) {
        subscription = subscribers[event][i];
        subscription.callback.apply(subscription.context, args);
      }

      // Return the workflow object for the chaining pattern.
      return this;
    };

    // Subscribe to a particular event on this workflow.
    this.subscribe = function (event, callback, context) {
      // Create a subscription object, stored by the private `subscribers` object.
      var subObj = {
        callback: callback,
        // Set the context of `this` during the callback to the specified `context` or `null` by default.
        context: context || null
      };
      // If this is the first subscriber to a particular event, initialise `Object.event` property to a new array.
      if (subscribers[event] === undefined) {
        subscribers[event] = [];
      }
      // Push the subscription object onto the stack.
      subscribers[event].push(subObj);
      // Return the workflow for the chaining pattern.
      return this;
    };

    // Unsubscribe from a particular event on this workflow.
    this.unsubscribe = function (event, callback) {
      // If there are no subscribers to this event, return immediately.
      if(!subscribers[event]) {
        return this;
      }
      var length = subscribers[event].length,
          i = 0;
      // For every subscriber to this event, check if the callback provided is registered,
      // and if so, remove it.
      for ( ; i < length; i += 1) {
        if(subscribers[event][i].callback === callback) {
          subscribers[event].splice(i, 1);
        }
      }
      // Return the workflow for the chaining pattern.
      return this;
    };

    // Get the unique ID of this workflow.


    // Get the number of iterations of this workflow
    this.getIterations = function () {
      return iterations;
    };

    // Set the number of iterations of this workflow
    this.setIterations = function (newIterations) {
      iterations = newIterations;
    };
  };

  // Create the `UncertWeb.Workflow` `prototype` object.
  UncertWeb.Workflow.prototype = {
    // Copy the slice/splice functions from the `Array` prototype to enable
    // Array-like behaviour in workflows.
    slice: [].slice,
    splice: [].splice,

    // Append a component, or array of components, to the workflow at a specified `index`.
    append: function (components, index) {
      // If only a single component was provided, wrap it in an array.
      components = UncertWeb.isArray(components) ? components : [components];
      var args = [],
          i = components.length - 1;

      // If no index is provided, set it to the position of length - 1.
      index = index === undefined ? this.length - 1 : index;

      // Insert the components at the specified index.
      this.splice.apply(this, [index + 1, 0].concat(components));

      // Search every component just added.
      for( ; i >= 0; i -= 1) {
        // If the component is a workflow, subscribe to the workflow/update event using the
        // `wrapCallback` helper function.
        if(UncertWeb.isWorkflow(components[i])) {
          wrapCallback.call(this, components[i]);
        } else {
          components[i]['workflow'] = this;
        }
        components[i]['parent'] = this;
      }
      // Publish some events to let observers know we have updated.
      this.publish('workflow/component/add', components);
      this.publish('workflow/update', this);

      // Return the workflow object for the chaining pattern.
      return this;
    },

    // Clear the workflow object of all components.
    clear: function () {
      // Use splice to do our dirty work.
      this.splice(0, this.length);
      // Publish some events to let observers know we have updated and cleared.
      this.publish('workflow/clear');
      this.publish('workflow/update');
      // Return the workflow object for the chaining pattern.
      return this;
    },

    // Remove the component at the specified index.
    remove: function (index) {
      var removed;
      // Use splice to remove the component.
      this.splice(index, 1);
      // Publish some events to let observers know whe have updated.
      this.publish('workflow/component/remove', removed);
      this.publish('workflow/update', this);

      // Return the workflow object for the chaining pattern.
      return this;
    }
  };


  // Encode module
  // --------------

  // Create the root Document node - used to create XML elements
  var doc = document.implementation.createDocument(null, null, null);
  var url = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  // Helper method to create XML elements
  // http://stackoverflow.com/questions/3191179/generate-xml-document-in-memory-with-javascript
  function XML() {
    var components,
        namespace,
        elementName,
        node,
        text,
        child,
        attributeIndex = 1,
        i = 1;

    // Namespace provided if second argument is string and first argument matches a url
    if(UncertWeb.isString(arguments[1]) && arguments[0].match(url)) {
      node = doc.createElementNS(arguments[0], arguments[1]);
      i += 1;
      attributeIndex += 1;
    } else {
      // no namespace
      node = doc.createElementNS("", arguments[0]);
    }

    if(UncertWeb.isObject(arguments[attributeIndex])) { // attributes object
      // increase i to exclude attributes from child nodes
      i += 1;
      var attributes = arguments[attributeIndex];
      for(var attr in attributes) {
        if (attributes.hasOwnProperty(attr)) {
          node.setAttribute(attr, attributes[attr]);
        }
      }
    }

    // Add every other argument as a child node
    for( ; i < arguments.length; i++) {
        child = arguments[i];
        if(typeof child == 'string') {
            child = doc.createTextNode(child);
        }
        node.appendChild(child);
    }
    return node;
  }

  // Helper function to generate a scriptTask node for a component
  function scriptTask(component) {
    return XML(
        'scriptTask',
        {
          completionQuantity: 1,
          isForCompensation: false,
          name: "[" + component.annotation + "] " + component.name,
          startQuantity: 1,
          id: component.id
        }
    );
  }

  // Create a subProcess element
  function subProcess(id, iterations) {
    // if iterations is undefined replace with the question mark syntax
    iterations = iterations || '?';
    return XML('subProcess', {
      completionQuantity: 1,
      id: id,
      isForCompensation: false,
      name: '[' + iterations + '] Multiple instances (one for each environmental dataset)',
      startQuantity: 1,
      triggeredByEvent: false
    }, XML('multiInstanceLoopCharacteristics', {
      behavior: 'All',
      isSequential: false
    },  XML('loopDataInputRef', id + "_input"),
        XML('inputDataItem', {
          isCollection: false
        }),
        XML('outputDataItem', {
          isCollection: false
        })
      )
    );
  }

  // Create a startEvent element
  function startEvent(id) {
    return XML('startEvent', {
      id: id,
      isInterrupting: 'true',
      name: 'Start',
      parallelMultiple: false
    });
  }

  // Create an endEvent element
  function endEvent(id, isTermination) {
    var end = XML('endEvent', {
      id: id,
      name: "End"
    });

    // Is the ultimate endEvent (i.e. end of the workflow)
    if(isTermination) {
      end.appendChild(XML('terminateEventDefinition', {
        id: id + "_end_ED_1"
      }));
    }

    return end;
  }

  // Create a sequenceFlow element - models the connections to and from each component
  function sequenceFlow(from, to) {
    return XML('sequenceFlow', {
      id: from + "-" + to,
      sourceRef: from,
      targetRef: to
    });
  }

  // Create an itemDefinition element - used for each subProcess
  function itemDefinition(id) {
    return XML('itemDefinition', {
      id: id + "_multiInstanceItemType",
      isCollection: false,
      itemKind: "Information"
    });
  }

  // Encodes a workflow into BPMN
  function encodeWorkflow(workflow, appendTo, isNestedWorkflow) {
    isNestedWorkflow = isNestedWorkflow || false;

    // Add the start event
    var startID = workflow.id + "_start";
    appendTo.appendChild(startEvent(startID));

    // for each child of the workflow, create the relevant XML
    for (var i = 0; i < workflow.length; i++) {
      var child = workflow[i];
      if(UncertWeb.isComponent(child)) {
        appendTo.appendChild(scriptTask(child));
      } else if(UncertWeb.isWorkflow(child)) {
        // this is a subprocess
        var sp = subProcess(child.id, child.getIterations());
        encodeWorkflow(child, sp, true);
        appendTo.appendChild(sp);
      }
    }

    // Add the end event
    var endID = workflow.id + "_end";
    appendTo.appendChild(endEvent(endID, !isNestedWorkflow));
    // Add the sequence flow
    createLink(appendTo, startID, workflow[0]);

    // Assume workflow is in order of execution
    for ( i = 0; i < workflow.length - 1; i++) {
      var c = workflow[i];
      var end = workflow[i+1];
      createLink(appendTo, c, end);
    }

    // Add end sequence
    createLink(appendTo, workflow[workflow.length - 1], endID);
  }

  // Creates a link between 2 components
  function createLink (doc, from, to) {
    var fromID = from.id || from,
        toID = to.id || to;

    // Append the sequenceFlow attribute
    doc.appendChild(sequenceFlow(fromID, toID));

    // update the script tasks
    var $doc = $(doc),
        start = $doc.find('[id="' + fromID + '"]').get(0),
        end = $doc.find('[id="' + toID + '"]').get(0);

    end.appendChild(incoming(fromID, toID));
    start.appendChild(outgoing(fromID, toID));

    if(from.connections && from.connections.length > 0) {
      start.appendChild(ioSpecification(from));
      appendDataOutputAssociations(doc, from);
    }
  }

  function incoming (from, to) {
    return XML(
      'incoming',
      from + '-' + to
    );
  }

  function outgoing (from, to) {
    return XML(
      'outgoing',
      from + '-' + to
    );
  }

  function ioSpecification (component) {
    var io = XML('ioSpecification'),
        i;

    for(i = 0; i < component.outputs(true).length; i++) {
      io.appendChild(dataOutput(component.outputs(true)[i]));
    }

    for(i = 0; i < component.inputs(true).length; i++) {
      io.appendChild(dataInput(component.inputs(true)[i]));
    }

    io.appendChild(inputSet(component));
    io.appendChild(outputSet(component));

    return io;
  }

  function dataOutput (output) {
    return XML(
      'dataOutput',
      {
        id: output.id,
        isCollection: false,
        name: output.name
      }
    );
  }

  function dataInput (input) {
    return XML(
      'dataInput',
      {
        id: input.id,
        isCollection: false,
        name: input.name
      }
    );
  }

  function inputSet (component) {
    var set =XML(
      'inputSet'
    );

    for (var i = 0; i < component.inputs(true).length; i++) {
      set.appendChild(dataInputRef(component.inputs(true)[i]));
    }

    return set;
  }

  function outputSet (component) {
    var set = XML(
      'outputSet'
    );

    for (var i = 0; i < component.outputs(true).length; i++) {
      set.appendChild(dataOutputRef(component.outputs(true)[i]));
    }

    return set;
  }

  function dataOutputRef (output) {
    return XML(
      'dataOutputRefs',
      output.id
    );
  }

  function dataInputRef (input) {
    return XML(
      'dataInputRefs',
      input.id
    );
  }

  function appendDataOutputAssociations (doc, component) {
    var connections = component.connections;
    console.log(connections);
    if(connections === undefined) return;

    for (var i = 0; i < connections.length; i++) {
      // var id = appendDataObject(doc),
      //     connection = component,
      //     scriptTaskTo = $(doc).find('[id="' + outputs[i].component.id + '"]').get(0);
      // console.log(scriptTaskTo);

      // scriptTaskFrom.appendChild(dataOutputAssociation(component.outputs(true)[i].id, id));
      // scriptTaskTo.appendChild(dataInputAssociation(component.findConnection(component.outputs(true)[i]).input.id, id));
    }
  }

  function dataOutputAssociation (source, target) {
    return XML(
      'dataOutputAssociation',
      {
        id: UncertWeb.uid()
      },
      XML(
        'sourceRef',
        source
      ),
      XML(
        'targetRef',
        target
      )
    );
  }

  function dataInputAssociation (target, source) {
    return XML(
      'dataInputAssociation',
      {
        id: UncertWeb.uid()
      },
      XML(
        'sourceRef',
        source
      ),
      XML(
        'targetRef',
        target
      )
    );
  }

  function appendDataObject (doc) {
    var id = UncertWeb.uid(),
        refID = UncertWeb.uid();

    var _obj = XML(
      'dataObject',
      {
        id: id,
        isCollection: false,
        name: 'ParameterName'
      }
    );

    var _ref = XML(
      'dataObjectReference',
      {
        dataObjectRef: id,
        id: refID
      }
    );

    doc.appendChild(_obj);
    doc.appendChild(_ref);

    return refID;
  }

  // Function to tidy up the XML to ensure it is all in the correct order
  function tidy (doc) {
    var $doc = $(doc),
        $process = $doc.children('process');

    var $tasks = $process.children('scripttask');
    var $subProcesses = $process.children('subprocess');
    var $endEvents = $process.children('endevent');

    $tasks.each(function () {
      var $task = $(this);
      $task.children('iospecification').prependTo($task);
      $task.children('outgoing').prependTo($task);
      $task.children('incoming').prependTo($task);
    });

    $subProcesses.each(function () {
      var $sub = $(this);
      $sub.children('endevent').prependTo($sub);
      $sub.children('sequenceflow').prependTo($sub);
      $sub.children('scripttask').prependTo($sub);
      $sub.children('startevent').prependTo($sub);
      $sub.children('multiInstanceLoopCharacteristics').prependTo($sub);
      $sub.children('outgoing').prependTo($sub);
      $sub.children('incoming').prependTo($sub);
    });

    $endEvents.each(function () {
      var $end = $(this);
      $end.children('outgoing').prependTo($end);
      $end.children('incoming').prependTo($end);
    });



    return doc;
  }

  // Create the Uncertweb.Encode module
  UncertWeb.Encode = {
    asBPMN: function (workflow) {
      var bpmn = XML('definitions', {
        'xmlns'               : UncertWeb.namespaces.BPMN,
        'xmlns:bpmndi'        : UncertWeb.namespaces.BPMNDI,
        'xmlns:dc'            : UncertWeb.namespaces.DC,
        'xmlns:di'            : UncertWeb.namespaces.DI,
        'xmlns:g'             : UncertWeb.namespaces.G,
        'xmlns:tns'           : UncertWeb.namespaces.TNS,
        'xmlns:xsd'           : UncertWeb.namespaces.XSD,
        'xmlns:xsi'           : UncertWeb.namespaces.XSI,
        'exporter'            : 'UncertWeb JavaScript Client',
        'exporterVersion'     : '0.1',
        'id'                  : 'Definition',
        'name'                : '',
        'expressionLanguage'  : UncertWeb.namespaces.MVEL,
        'targetNamespace'     : UncertWeb.namespaces.TNS,
        'typeLanguage'        : UncertWeb.namespaces.JAVA,
        'xsi:schemaLocation'  : UncertWeb.namespaces.BPMN + ' http://bpmn.sourceforge.net/schemas/BPMN20.xsd'
      });

      // A workflow has been passed in
      if (workflow) {
        var process = XML('process', {
            isClosed: false,
            isExecutable: true,
            name: workflow.id,
            processType: 'Private'
          });

        encodeWorkflow(workflow, process);

        // create an itemDefinition for each nested workflow and attach it to the bpmn document
        for (var i = 0; i < workflow.length; i++) {
          if(UncertWeb.isWorkflow(workflow[i])) {
            bpmn.appendChild(itemDefinition(workflow[i].id));
          }
        }

        // attach the process to the bpmn document
        bpmn.appendChild(process);
      }
      return tidy(bpmn);
    }
  };

  // CaaS Module
  // -----------

  function encodeMetadata(metadata) {
    var caasMetadata = XML(
      UncertWeb.namespaces.CAAS,
      'caas:metadata',
      XML(
        UncertWeb.namespaces.GMD,
        'gmd:MD_Metadata',
        encodeISOLanguage(),
        encodeISOCharacterSet(),
        encodeISOContact(metadata.organisation),
        encodeISODateStamp(),
        encodeIdentificationInfo(metadata.title, metadata.description)
      )
    );
    return caasMetadata;
  }

  function encodeISOLanguage() {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:language',
      XML(
        UncertWeb.namespaces.GMD,
        'gmd:LanguageCode',
        {
          'codeList': 'http://www.isotc211.org/2005/resources/Codelist/ML_gmxCodelists.xml#LanguageCode',
          'codeListValue': 'eng'
        },
        "English"
      )
    );
  }

  function encodeISOCharacterSet() {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:characterSet',
      XML(
        UncertWeb.namespaces.GMD,
        'gmd:MD_CharacterSetCode',
        {
          'codeListValue': 'utf8',
          'codeList': 'http://www.isotc211.org/2005/resources/Codelist/gmxCodeLists.xml#MD_CharacterSetCode',
          'codeSpace': 'ISOTC211/19115'
        },
        'utf8'
      )
    );
  }

  function encodeISOContact(organisation) {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:contact',
      XML(
        UncertWeb.namespaces.GMD,
        'gmd:CI_ResponsibleParty',
        XML(
          UncertWeb.namespaces.GMD,
          'gmd:organisationName',
          encodeCharacterString(organisation)
        ),
        XML(
          UncertWeb.namespaces.GMD,
          'gmd:role',
          XML(
            UncertWeb.namespaces.GMD,
            'gmd:CI_RoleCode',
            {
              'codeList': 'http://www.isotc211.org/2005/resources/Codelist/gmxCodeLists.xml#CI_RoleCode',
              'codeListValue': 'pointOfContact',
              'codeSpace': 'ISOTC211/19115'
            },
            'pointOfContact'
          )
        )
      )
    );
  }

  function encodeCharacterString (string) {
    return XML(
      UncertWeb.namespaces.GCO,
      'gco:CharacterString',
      string
    );
  }

  function encodeISODateStamp() {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:dateStamp',
      encodeDate()
    );
  }

  function encodeDate() {
    var date = new Date(),
        dateString;

    dateString = date.getFullYear() + '-' +
                 ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
                 ('0' + date.getDate()).slice(-2);
    return XML(
      UncertWeb.namespaces.GCO,
      'gco:Date',
      dateString
    );
  }

  function encodeIdentificationInfo(title, description) {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:identificationInfo',
      XML(
        UncertWeb.namespaces.GMD,
        'gmd:MD_DataIdentification',
        encodeCitation(title),
        encodeAbstract(description),
        encodeISOLanguage()
      )
    );
  }

  function encodeCitation(title) {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:citation',
      XML(
        UncertWeb.namespaces.GMD,
        'gmd:CI_Citation',
        XML(
          UncertWeb.namespaces.GMD,
          'gmd:title',
          encodeCharacterString(title)
        ),
        XML(
          UncertWeb.namespaces.GMD,
          'gmd:date',
          XML(
            UncertWeb.namespaces.GMD,
            'gmd:CI_Date',
            XML(
              UncertWeb.namespaces.GMD,
              'gmd:date',
              encodeDate()
            ),
            XML(
              UncertWeb.namespaces.GMD,
              'gmd:dateType',
              XML(
                UncertWeb.namespaces.GMD,
                'gmd:CI_DateTypeCode',
                {
                  'codeList': 'http://www.isotc211.org/2005/resources/Codelist/gmxCodeLists.xml#CI_DateTypeCode',
                  'codeListValue': 'creation',
                  'codeSpace': 'ISOTC211/19115'
                },
                'creation'
              )
            )
          )
        )
      )
    );
  }

  function encodeAbstract(description) {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:abstract',
      encodeCharacterString(description)
    );
  }

  // Helper function to encode a workflow + metadata into a CaaS bpmnCreateRequest element
  function encodePublishRequest(workflow, metadata) {
    var encodedWorkflow = UncertWeb.Encode.asBPMN(workflow);

    var request = XML(
      UncertWeb.namespaces.CAAS,
      'caas:bpmnCreateRequest',
      {
        'xmlns:gco':  UncertWeb.namespaces.GCO,
        'xmlns:gmd':  UncertWeb.namespaces.GMD,
        'xmlns:caas': UncertWeb.namespaces.CAAS,
        'xmlns:xsi':  UncertWeb.namespaces.XSI,
        'xsi:schemaLocation': UncertWeb.namespaces.CAAS + ' http://zeus.pin.unifi.it/schemas/GI-caas/1.0/caas2.xsd'
      },
      encodeMetadata(metadata),
      XML(
        UncertWeb.namespaces.CAAS,
        'caas:model',
        encodedWorkflow
      )
    );

    return (new XMLSerializer()).serializeToString(request);
  }

  UncertWeb.CaaS = {
    publish: function(workflow, metadata) {
      var $promise = $.Deferred(),
          startTime = +new Date(),
          results;

      // We need metadata
      if (metadata === undefined) {
        $promise.reject("Metadata is required");
        return $promise;
      }

      var $innerPromise = $.ajax({
        url: UncertWeb.options.caas_url,
        type: 'POST',
        contentType: 'text/xml',
        processData: false,
        data: encodePublishRequest(workflow, metadata)
      });

      $innerPromise.done(function (data) {
        var endTime = new Date();
        results = {
          data: data,
          completed_in: (+new Date() - startTime) / 1000
        };
        $promise.resolve(results);
      }).fail(function () {
        $promise.reject(arguments);
      });

      // return the promise straight away
      return $promise;
    },

    'delete': function(id) {
      $.ajax({
        url: UncertWeb.options.caas_delete_url,
        data: {
          id: id
        }
      });
    }
  };

  // Make the UncertWeb object visible
  global.UncertWeb = UncertWeb;

// Make sure we have access to jQuery and the global object inside.
}(jQuery, this));