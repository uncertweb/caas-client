(function () {

  UncertWeb.options.broker_url = "../lib/broker.php";
  UncertWeb.options.iso_broker_url = "../lib/iso_broker.php";
  UncertWeb.options.caas_url = "../lib/caas.php";
  UncertWeb.options.caas_delete_url = "../lib/caas_delete.php";

  // helper functions
  var generateComponent = function () {
    return new UncertWeb.Component({
      name: Date(),
      description: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium.',
      annotation: '[access:raster]',
      inputs: [
        {
          id: true
        }
      ],
      outputs: [
        {}
      ]
    });
  };

  var generateEHabitat = function () {
    var workflow = new UncertWeb.Workflow(),
        nestedWorkflow1 = new UncertWeb.Workflow(),
        nestedWorkflow2 = new UncertWeb.Workflow();

    var wcsAccess = new UncertWeb.Component({
      name: 'WCS Access Broker',
      description: 'test',
      annotation: 'access:raster'
    });

    var utsToRealisations = new UncertWeb.Component({
      name: 'UTS to realizations',
      description: 'test',
      annotation: 'processing:datamanipulation:montecarlorealization'
    });

    var multiplexer = new UncertWeb.Component({
      name: 'Multiplexer',
      description: 'test',
      annotation: 'utils:multiplexerU'
    });

    nestedWorkflow1.append([wcsAccess, utsToRealisations, multiplexer]);
    workflow.append(nestedWorkflow1);

    // Attach scriptTasks
    var scrambler = new UncertWeb.Component({
      name: 'List Scrambler',
      description: 'test',
      annotation: 'utils:scrambler'
    });

    var wcsT = new UncertWeb.Component({
      name: 'WCS-T',
      description: 'test',
      annotation: 'publisher:raster'
    });

    workflow.append([scrambler, wcsT]);

    // Build second nested workflow
    var eHabitat = new UncertWeb.Component({
      name: 'eHabitat',
      description: 'test',
      annotation: 'processing:geoprocessing:thematic:gpc:ehabitat'
    });

    nestedWorkflow2.append(eHabitat);

    workflow.append(nestedWorkflow2);

    // Add the remaining tasks
    var demultiplexer = new UncertWeb.Component({
      name: 'Demultiplexer',
      description: 'test',
      annotation: 'utils:demultiplexer'
    });

    var utsExtraction = new UncertWeb.Component({
      name: 'UTS Statistics Extraction',
      description: 'test',
      annotation: 'processing:datamanipulation:statisticsextraction'
    });

    var wcsPublisher = new UncertWeb.Component({
      name: 'WCS-T Publisher',
      description: 'test',
      annotation: 'publisher:raster'
    });

    var wcsGenerator = new UncertWeb.Component({
      name: 'WCS Url generator',
      description: 'test',
      annotation: 'access:raster'
    });

    workflow.append([demultiplexer, utsExtraction, wcsPublisher, wcsGenerator]);

    return workflow;
  };

  var generateFERA = function (context) {
    var callbacks = [],
        components = {},
        workflow,
        dfd = new $.Deferred();

    $.each([
      {name: 'lccs', id: 'urn:X-GI-caas:id:Land Capability Classification' },
      {name: 'utms', id: 'urn:X-GI-caas:id:Uncertain Transition Matrix Sampler' },
      {name: 'fact', id: 'urn:X-GI-caas:id:Landsfacts' },
      {name: 'vis', id: 'urn:X-GI-caas:id:Visualizer' }
    ], function (index, value) {
      callbacks.push(UncertWeb.broker.getDetails(value.id).done(function (data) {
        components[value.name] = new UncertWeb.Component(data);
      }));
    });

    $.when.apply($, callbacks).then(function () {
      workflow = new UncertWeb.Workflow();
      var nestedWorkflow = new UncertWeb.Workflow();
      var lccs = components['lccs'];
      var utms = components['utms'];
      var fact = components['fact'];
      var vis = components['vis'];

      workflow.append(lccs);
      workflow.append(utms);

      nestedWorkflow.append(fact);
      nestedWorkflow.append(vis);
      workflow.append(nestedWorkflow);

      // IO linking
      lccs.connect(lccs.outputs()[0], utms.inputs()[0]);
      utms.connect(utms.outputs()[0], fact.inputs()[2]);

      dfd.resolve(workflow);
    });

    return dfd;
  };

  module('UncertWeb', {
    setup: function () {

    }
  });

  test("UncertWeb object", function() {
    equal(UncertWeb === undefined, false, "UncertWeb should not be undefined.");
  });

  test("_typeOf function", function () {
    equal(UncertWeb._typeOf === undefined, true, "_typeOf should be private");
  });

  test("isFunction method", function () {
    equal(UncertWeb.isFunction === undefined, false, "isFunction should not be undefined");
    equal(Object.prototype.toString.call(UncertWeb.isFunction), '[object Function]', "Should be of type function");
    ok(UncertWeb.isFunction(function () {}), "Works on empty function");
  });

  test("isArray method", function () {
    equal(UncertWeb.isArray === undefined, false, "isArray should not be undefined.");
    ok(UncertWeb.isFunction(UncertWeb.isArray), "Should be of type function");
    ok(UncertWeb.isArray([]), "Works on empty array.");
  });

  test("isObject method", function () {
    equal(UncertWeb.isObject === undefined, false, "isObject should not be undefined");
    ok(UncertWeb.isFunction(UncertWeb.isObject), "Should be of type function");
    ok(UncertWeb.isObject({}), "Works on empty object");
  });

  test("isNumber method", function () {
    ok(UncertWeb.isFunction(UncertWeb.isNumber), "isNumber should exist and be a function");
    ok(UncertWeb.isNumber(12), "and should return true when it is passed a number");
    ok(!UncertWeb.isNumber("not a number"), "and false if it is not a number");
  });

  test("isString method", function () {
    ok(UncertWeb.isFunction(UncertWeb.isString), "isString should exist and be a function");
    ok(UncertWeb.isString("test"), "and should return true when it is passed a string");
    ok(!UncertWeb.isString(12), "and false if it is not a string");
  });

  test("isWorkflow method", function () {
    ok(UncertWeb.isFunction(UncertWeb.isWorkflow), "isWorkflow should exist and be a function");
    ok(UncertWeb.isWorkflow(new UncertWeb.Workflow()), "and return true when passed a workflow");
    ok(!UncertWeb.isWorkflow(function() {}), "and false when it is not");
  });

  test("isComponent method", function () {
    ok(UncertWeb.isFunction(UncertWeb.isComponent), "isWorkflow should exist and be a function");
    ok(UncertWeb.isComponent(new UncertWeb.Component({
      name: 'name',
      annotation: 'annotation'
    })), "and return true when passed a workflow");
    ok(!UncertWeb.isComponent(function() {}), "and false when it is not");
  });

  test("uid method", function () {
    var id = UncertWeb.uid(),
        limit = 1000000, // generate a lot of unique IDs!
        duplicate = false,
        ids = [],
        currID = 0,
        i = 0;
    ok(id, "uid should return an ID");
    for(i = 0; i < limit; i++) {
      currID = UncertWeb.uid();
      // test last one
      if(ids[i - 1] === currID) {
        duplicate = true;
        break;
      }
      ids.push(currID);
    }
    equal(ids.length, limit, "it should have generated " + limit + " ids");
    ok(!duplicate, "And no duplicates should be generated");
  });

  module('Workflow', {
    setup: function () {
      this.workflow1 = new UncertWeb.Workflow({
        id: 'MYID',
        iterations: 5
      });
      this.workflow2 = new UncertWeb.Workflow();
      this.workflow1clone = this.workflow1;
      this.component1 = generateComponent();
      this.component2 = generateComponent();
      this.component3 = generateComponent();
      this.callback_with_data = function (data) {
        equal(this.workflow1, data, "... and pass the workflow object as data");
      };
      this.callback = function () {
        ok(true, "Adding a component should fire the workflow/update event");
      };
    },

    teardown: function () {
      // UncertWeb.clear();  // clear callbacks
    }
  });

  test("Workflow object", function  () {
    equal(UncertWeb.Workflow === undefined, false, "Workflow should not be undefined.");
  });

  test("Workflow constructor function", function () {
    ok(UncertWeb.isObject(this.workflow1), "Workflow should be an object.");
    ok(this.workflow1 !== this.workflow2, "Two workflow objects should not be equal");
    ok(this.workflow1 === this.workflow1clone, "Two identical objects should be equal");
  });

  test("Workflow length property", function () {
    equal(this.workflow1.length === undefined, false, "Should exist");
    ok(this.workflow1.length === 0, "Should be 0 for an empty workflow.");
  });

  test("Workflow access using [] notation", function () {
    equal(this.workflow1[0], undefined, "Empty Workflow should have no components");

    // add a component
    this.workflow1.append(this.component1);

    equal(this.workflow1[0], this.component1, "Adding a component makes it accessible at workflow[0]");

  });

  test("append function", function () {
    expect(15);

    ok(this.workflow1.append, "append method should exist");
    raises(function () {
      this.workflow1.append();
    }, "append requires a parameter");

    raises(function () {
      this.workflow1.append({});
    }, "append only accepts a Component as input");

    // valid add component;
    var ret_value = this.workflow1.append(this.component1);

    equal(this.workflow1.length, 1, "Adding a component increases the length of workflow");

    equal(ret_value === this.workflow1, true, "The result of append should be the workflow");

    // fill up workflow
    this.workflow1.append(this.component1).append(this.component1);

    // add to the end
    this.workflow1.append(this.component2);

    equal(this.component2 === this.workflow1[this.workflow1.length - 1], true, "Append should add the component to the end of the list");
    equal(this.component2 === this.workflow1[0], false, "Append should not add to the start of the list");

    ok(this.workflow1.append(this.component1, 2), "append accepts a second argument");
    raises(function () {
      this.workflow1.append(this.component1, {});
    }, "append second argument should be numeric");

    // start with clean workflow
    this.workflow1.clear();

    // add c then c2
    this.workflow1.append(this.component1).append(this.component2);
    // insert middle after position 0
    this.workflow1.append(this.component3, 0);

    equal(this.workflow1[1] === this.component3, true, "Component at position 1 should be c3");
    equal(this.workflow1[0] === this.component1, true, "Component at position 0 should be c");
    equal(this.workflow1[2] === this.component2, true, "Component at position 2 should be c2");

    // clear it down
    this.workflow1.clear();
    this.workflow1.append([this.component1, this.component2, this.component3]);

    equal(this.workflow1.length, 3, "Append should work on arrays of components");
    ok(this.component1 === this.workflow1[0], "Component at position 0 should be c");
    ok(this.component3 === this.workflow1[2], "Component at position 2 should be c3");

  });

  test("Append workflow", function () {

    ok(this.workflow1.append(this.workflow2), "Append should allow workflows to be appended");
    equal(this.workflow1[0], this.workflow2, "Workflows are accessible just like components");
    ok(this.workflow1.append(this.component1), "Workflows should be able to accept mixed content");
    equal(this.workflow1.length, 2, "Workflows as children count to parent length");
    ok(this.workflow1[0].append(this.component1), "Workflows as children can be appended to");

    ok(this.workflow2.parent, "a nested workflow should have a parent attribute");
    equal(this.workflow2.parent, this.workflow1, "and it should be equal to the workflow it was appended to");

    equal(this.workflow1.parent, undefined, "A workflow that is not nested should NOT have a parent attribute");
  });

  test("Append callbacks", function () {
    expect(2);
    // register callbacks
    this.workflow1.subscribe('workflow/update', this.callback);
    this.workflow1.subscribe('workflow/update', this.callback_with_data, this);

    // // append sommit
    this.workflow1.append(this.component1);
  });

  test("Append to child callbacks", function () {
    expect(2);
    // // register callbacks
    this.workflow1.subscribe('workflow/update', this.callback_with_data, this);

    this.workflow1.append(this.workflow2);
    // append a component to the child workflow
    this.workflow1[0].append(this.component2);
  });

  test("remove method", function () {
    ok(this.workflow1.remove, "Remove method should exist");
    raises(function () {
      this.workflow1.remove();
    }, "remove requires a parameter");
    raises(function () {
      this.workflow1.remove({});
    }, "remove expects a numeric input");
    raises(function () {
      this.workflow1.remove(0);
    }, "remove fails if an index is out of bounds");

    // add a component
    this.workflow1.append(this.component1);

    // remove it
    var ret_value = this.workflow1.remove(0);

    equal(this.workflow1.length, 0, "Removing a component decreases the length");
    equal(this.workflow1 === ret_value, true, "remove returns the workflow object");
    equal(this.workflow1[0], undefined, "Accessing a removed component is not possible");

    // add 5 more components
    this.workflow1.append([this.component1, this.component2, this.component3, this.component1, this.component2]);

    // remove a component from the middle
    this.workflow1.remove(2);

    equal(this.workflow1.length, 4, "remove should decrease the length when a component is removed from the middle");
    equal(this.workflow1[4], undefined, "remove should shift all elements down");

    // remove them all
    this.workflow1.remove(0).remove(0).remove(0).remove(0);

    equal(this.workflow1.length, 0, "Removing all components should result in length 0");
    equal(this.workflow1[0], undefined, "Removing all elements means nothing is accessible");

    raises(function () {
      this.workflow1.remove(0);
    }, "remove on an empty workflow should throw an exception");

  });

  test("Remove method events", function () {
    expect(4);
    // register callbacks
    this.workflow1.subscribe('workflow/update', this.callback);
    this.workflow1.subscribe('workflow/update', this.callback_with_data, this);

    // append sommit
    this.workflow1.append(this.component1).remove(0);
  });

  test("clear method", function () {
    expect(5);

    ok(this.workflow1.clear, "clear method should exist");
    equal(this.workflow1.clear() === this.workflow1, true, "clear method should return the workflow");
    ok(this.workflow1.clear(), "clear should work on an empty workflow");

    // add some components then clear
    this.workflow1.append([this.component1, this.component2, this.component3]).clear();

    equal(this.workflow1.length, 0, "Clearing should set length to 0");
    equal(this.workflow1[0], undefined, "After clearing no components should be left");

  });

  test("Clear method event", function () {
    expect(2);

    // register callback
    this.workflow1.subscribe('workflow/update', this.callback);

    // append sommit
    this.workflow1.append(this.component1).clear();
  });

  test("Unsubscribe method", function () {
    expect(1);
    // add subscription
    this.workflow1.subscribe('workflow/update', this.callback, this.workflow1);
    // test is working (will expect an assertion)
    this.workflow1.append(this.workflow2);
    // unsubscribe
    this.workflow1.unsubscribe('workflow/update', this.callback);
    // test it has been unsubscribed (shouldn't be another assertion)
    this.workflow1.clear();
  });

  test("public properties", function () {
    ok(this.workflow1.id, "Workflows should have an ID accessible");
    ok(this.workflow1.id !== this.workflow2.id, "and they should not be the same as another workflow");
    equal(this.workflow1.id, 'MYID', "IDs should be manually set if passed in the constructor");

    ok(this.workflow1.iterations, "a workflow should have a number of iterations is supplied in the constructor");
    equal(this.workflow1.iterations, 5, "and it should be set accordingly");


  });


  module('Component', {

    setup: function () {
      var self = this;
      stop();

      var all = {
          name: 'name',
          description: 'description',
          annotation: 'annotation'
        };

        this.missing_description = {
          name: 'name',
          annotation: 'annotation'
        };

        this.missing_annotation = {
          name: 'name',
          description: 'description'
        };

        this.missing_type = {
          description: 'description',
          annotation: 'annotation',
          name: 'name'
        };

        this.wrong_type = {
          name: 'name',
          description: 'description',
          annotation: 'annotation'
        };

        this.missing_name = {
          description: 'description',
          annotation: 'annotation'
        };

        UncertWeb.broker.all().done(function (results) {
          console.log(results);
          self.metadata1 = results.results[0];
          self.component1 = new UncertWeb.Component(self.metadata1);
          self.metadata2 = results.results[1];
          self.metadata2.id = undefined;
          self.component2 = new UncertWeb.Component(self.metadata2);
          self.component1clone = self.component1;
          start();
        });
    }
  });

  test("Component object", function () {
    equal(UncertWeb.Component === undefined, false, "Component should not be undefined.");
  });

  test("Component constructor function", function () {
    expect(5);
    ok(UncertWeb.isObject(this.component1), "Component should be an object");
    ok(this.component2 !== this.component1, "Two Component objects should not be equal");
    ok(this.component1clone === this.component1, "Two identical Component objects should be equal");

    // optional properties
    ok(this.component1, "Component with all properties should construct");
    ok(new UncertWeb.Component(this.missing_description), "Description is optional");
  });

  test("Component properties", function () {
    // name property
    ok(UncertWeb.isString(this.component1.name), "Name property should be a string");
    equal(this.component1.name, this.metadata1.name, "and it should equal the supplied parameter");
    // description property
    ok(UncertWeb.isString(this.component1.description), "description property should be a string");
    equal(this.component1.description, this.metadata1.description, "and it should equal the supplied parameter");
    // annotation property
    ok(UncertWeb.isString(this.component1.annotation), "annotation property should be a string");
    equal(this.component1.annotation, this.metadata1.annotation, "and it should equal the supplied parameter");
    // id property
    ok(UncertWeb.isString(this.component1.id), "id property should be a string");
    if(this.metadata1.id) {
      console.log(this.metadata1.id);
      equal(this.component1.id, this.metadata1.id, "and it should equal the supplied ID if present");
    }

    // no id property
    ok(this.component2.id, "an ID should always exist, even if not supplied in the constructor");
    ok(UncertWeb.isString(this.component2.id), "and it should be a string");

    // Reference to parent workflow
    var workflow = new UncertWeb.Workflow();
    workflow.append(this.component1);
    ok(this.component1.workflow, "a component should have a workflow property if it belongs to a workflow");
    equal(this.component1.workflow, workflow, "and it should equal the workflow it belongs to");

    equal(this.component2.workflow, undefined, "a component not yet part of a workflow should not have a workflow property");

    // Top function
    var root = this.component1.root;
    ok(root, "a component should have a root property");
    ok(UncertWeb.isFunction(root), "that is a function");
    equal(this.component1.root(), workflow, "and it should return a reference to the root of the workflow");

    // multi nesting
    workflow.append(new UncertWeb.Workflow().append(this.component2));
    equal(this.component2.root(), workflow, "even if nested multiple times");
    console.log(this.component2.root());
  });

  module("Broker");

  test("Broker interface", function () {
    ok(UncertWeb.isObject(UncertWeb.broker), "Broker object should exist");
    ok(UncertWeb.isFunction(UncertWeb.broker.search), "and it should have a search function");
    ok(UncertWeb.isFunction(UncertWeb.broker.all), "and it should have an all function");
  });

  // test that the all function returns something
  test("Broker callback", function () {
    var expected_time = 3;
    expect(6);
    stop(); // pause the test
    UncertWeb.broker.all().done(function (data) {
      ok(data, "The search should return something");
      ok(UncertWeb.isNumber(data.num_results), "with a number of results");

      ok(data.completed_in, "it should also incude a time taken for the search");
      ok(data.completed_in < expected_time, "and it should return within " + expected_time + " seconds");

      ok(data.query, "it should also contain the query string sent to the broker");

      ok(UncertWeb.isArray(data.results), "but most importantly it should contain the results array");

      start();
    });
  });

  test("Broker results", function () {
    stop();

    UncertWeb.broker.all().done(function (data) {
      expect(data.num_results * 4);
      $.each(data.results, function (index, elem) {
        ok(elem.annotation !== undefined, "results should have an annotation");
        ok(elem.name !== undefined, "and a name");
        ok(elem.description !== undefined, "and a description");
        ok(elem.id !== undefined, "and an ID");
      });
      start();
    });
  });

  test("No results", function () {
    expect(3);
    var not_in_broker = "NOT_IN_THE_BROKER";
    stop();

    UncertWeb.broker.search(not_in_broker).done(function (data) {
      equal(data.results.length, 0, "searching for a term not in the broker should return an empty result set");
      equal(data.num_results, 0, "as reflected in the num_results property");
      ok(data.results, "but the results array should exist nonetheless");
      start();
    });
  });

  test('Override search config', function() {
    stop(1);
    expect(1);

    UncertWeb.broker.search("e").done(function (results) {
      ok(results.num_results > 1, "Searching for 'e' returns more than 1 result");
      start(1);
    });

    // Removed as you cannot guarantee the number or results returned by the broker
    // as there are unusable components present now.
    //
    // UncertWeb.broker.search("e", {
    //   ct: 1
    // }).done(function (results) {
    //   equal(results.num_results, 1, "Unless you override the search parameters");
    //   start(1);
    // });
  });

  test("Inline callbacks", function () {
    stop(3);
    expect(5);


    UncertWeb.broker.all(function (data) {
      ok(true, "inline callbacks should work");
      ok(data, "and have access to the data");
      ok(UncertWeb.isArray(data.results), "with a results array");
      start();
    });

    UncertWeb.broker.search("e", {}, function (data) {
      ok(true, "Inline callbacks work when config parameters sent");
      start();
    });



    UncertWeb.broker.search("e", {
      fail: true
    },
    function(){ /* success callback */ },
    function (status) {
      ok(true, "Inline fail callback also works");
      start();
    });
  });

  test("Broker performance", function () {

    var i = 0,
        iterations = 10,
        expected_time = 3,
        dfds = [],
        length,
        assert = function (data) {
          ok(data.completed_in < expected_time, "asynchronous requests should return in a reasonable time " + data.completed_in);
          start();
        };
    // stop until we hear start a certain number of times
    stop(iterations);
    expect(iterations);

    for( ; i < iterations; i += 1) {
      UncertWeb.broker.search('habitat').done(assert);
    }

  });

  test("ISO Broker getDetails", function () {
    stop();
    var dfd = UncertWeb.broker.all(),
        assert = function (component) {
          ok(component, "A component should exist");
          ok(component.id, "and it should have an id");
          ok(component.name, "and a name");
          ok(component.description, "and a description");
          ok(component.inputs.length > 0, "and some inputs");
          console.log(component.inputs);
          ok(component.outputs.length > 0, "and some outputs");
          start();
        },
        report = function (message) {
          console.error(message.message);
          start();
        };

    dfd.done(function (result) {
      var components = result.results;
      stop(components.length - 1);
      expect(components.length * 6);
      for (var i = 0; i < components.length; i++) {
        UncertWeb.broker.getDetails(components[i].id).done(assert).fail(report);
      }
    });
  });

  module("Encode", {
    // setup
    setup: function () {
      var self = this;
      stop();

      this.encoder = UncertWeb.Encode;
      var w = new UncertWeb.Workflow(),
          w2 = new UncertWeb.Workflow(),
          c,
          c2,
          c3;

      UncertWeb.broker.all().done(function (results) {
        c = new UncertWeb.Component(results.results[0]);
        c2 = new UncertWeb.Component(results.results[1]);
        c3 = new UncertWeb.Component(results.results[2]);

        // stub IO
        c._inputs = [{
          id: UncertWeb.uid(),
          name: "TEST input",
          component: c
        }];

        c2._inputs = [{
          id: UncertWeb.uid(),
          name: "TEST input",
          component: c2
        }];

        c3._inputs = [{
          id: UncertWeb.uid(),
          name: "TEST input",
          component: c3
        }];

        c._outputs = [{
          id: UncertWeb.uid(),
          name: "TEST output",
          component: c
        }];
        c2._outputs = [{
          id: UncertWeb.uid(),
          name: "TEST output",
          component: c2
        }];
        c3._outputs = [{
          id: UncertWeb.uid(),
          name: "TEST output",
          component: c3
        }];


        w2.append(c3);
        c.connect(c._outputs[0], c2._inputs[0]);
        w.append([c, c2, w2]);
        self.bpmn = UncertWeb.Encode.asBPMN(w);
        self.$bpmn = $(self.bpmn);
        self.workflow = w;
        self.component1 = c;
        self.component2 = c2;
        self.component3 = c3;
        start();
      });
    }
  });

  test("Encode module", function () {
    ok(UncertWeb.Encode, "The Encode module should exist in the UncertWeb object");
    ok(UncertWeb.isObject(UncertWeb.Encode), "and it should be an object literal");
    ok(UncertWeb.Encode.asBPMN, "and it should be able to encode as BPMN");
    ok(UncertWeb.isFunction(UncertWeb.Encode.asBPMN), "using a function");
  });

  test("BPMN encoding", function () {
    ok(this.bpmn, "asBPMN should always return something");
    ok(this.$bpmn.length > 0, "and it should be valid XML");
  });

  test("BPMN definition element", function () {
    equal(this.$bpmn.prop('tagName'), 'definitions', 'The root element should be definitions');
    ok(this.$bpmn.children().length > 0, "and it should have a child");
    // other attributes
    equal("UncertWeb JavaScript Client", this.$bpmn.attr('exporter'), "The exporter should be UncertWeb JavaScript Client");
    // Have to use javascript instead of jQuery as it doesn't handle camel-cased attribute names
    ok(this.bpmn.getAttribute('exporterVersion'), "the exporter should have a version number");
    equal("Definition", this.$bpmn.attr('id'), "and it should have an ID of Definition");
    equal("", this.$bpmn.attr('name'), "and a name (that is blank?)");
    equal("http://www.mvel.org/2.0", this.bpmn.getAttribute('expressionLanguage'), "and use MVEL as the expression language");
    equal("http://www.java.com/javaTypes", this.bpmn.getAttribute('typeLanguage'), "and a type language");
    equal("", this.bpmn.getAttributeNS("xsi", "schemaLocation"), "and a schema location");
  });

  test('BPMN namespace definitions', function() {
    // namespaces
    equal("http://www.omg.org/spec/BPMN/20100524/MODEL", this.$bpmn.attr('xmlns'), "and it should have an xmlns attribute");
    equal("http://www.omg.org/spec/BPMN/20100524/DI", this.$bpmn.attr('xmlns:bpmndi'), "and an xmlns:bpmndi attribute");
    equal("http://www.omg.org/spec/DD/20100524/DC", this.$bpmn.attr('xmlns:dc'), "and an xmlns:dc attribute");
    equal("http://www.omg.org/spec/DD/20100524/DI", this.$bpmn.attr('xmlns:di'), "and an xmlns:di attribute");
    equal("http://www.jboss.org/drools/flow/gpd", this.$bpmn.attr('xmlns:g'), "and an xmlns:g attribute");
    equal("http://www.jboss.org/drools", this.$bpmn.attr('xmlns:tns'), "and an xmlns:tns attribute");
    equal("http://www.w3.org/2001/XMLSchema", this.$bpmn.attr('xmlns:xsd'), "and an xmlns:xsd attribute");
    equal("http://www.w3.org/2001/XMLSchema-instance", this.$bpmn.attr('xmlns:xsi'), "and an xmlns:xsi attribute");
    equal("http://www.jboss.org/drools", this.bpmn.getAttribute('targetNamespace'), "and a target namespace");
  });

  test('BPMN process element', function() {
    var $process = this.$bpmn.children('process').eq(0),
    process = $process.get(0);

    equal(this.$bpmn.children('process').length, 1, "There should be a single process element representing the workflow");

    var isClosed = process.getAttribute('isClosed');
    ok(isClosed, "it should have a isClosed attribute");
    equal(isClosed, 'false', 'and it should be false');

    var isExecutable = process.getAttribute('isExecutable');
    ok(isExecutable, "it should also have an isExecutable attribute");
    equal(isExecutable, "true", "which is set to true");

    var name = process.getAttribute('name');
    ok(name, "it should also have a name");
    equal(this.workflow.id, name, "that is the same as the workflow ID");

    var processType = process.getAttribute('processType');
    ok(processType, "it should also have a processType");
    equal(processType, "Private", "that is private");
  });

  test('BPMN start events', function() {
    // Start and end events
    var self = this,
        $starts = this.$bpmn.find('startEvent');

    $starts.each(function () {
      var $start = $(this),
          start = $start.get(0);
      equal($start.length, 1, "there should be a start event for each workflow");

      var startID = $start.attr('id');
      ok(startID, "and it should have an ID");

      var startIsInterrupting = start.getAttribute('isInterrupting');
      ok(startIsInterrupting, "and it should have an isInterrupting attribute");
      equal(startIsInterrupting, "true", "that is set to true");

      var startName = start.getAttribute('name');
      ok(startName, "and it should have a name");
      equal(startName, "Start", "that is equal to Start");

      var startParellel = start.getAttribute('parallelMultiple');
      ok(startParellel, "it should also have a parallelMultiple attribute");
      equal(startParellel, "false", "that is false");
    });

  });

  test('BPMN end events', function() {
    var $ends = this.$bpmn.find('endEvent');

    $ends.each(function () {
      var $end = $(this);
      equal($end.length, 1, "A workflow should have a single end event");

      var endID = $end.attr('id');
      ok(endID, "and it should have an ID attribute");

      var endName = $end.attr('name');
      ok(endName, "and it should have a name attribute");
      equal(endName, "End", "that is equal to End");
    });

    var $theEnd = $ends.last();

    var ed = $theEnd.find('terminateEventDefinition');
    ok(ed, "An end event should have a terminateEventDefinition child");
    ok(ed.attr('id'), 'with an ID attribute');

  });

  test('BPMN script task', function() {
    var $tasks = this.$bpmn.find('scriptTask');
    equal($tasks.length, this.workflow.length, "The process should have a scriptTask node for each component");

    var task = $tasks.get(0);

    var completionQuantity = task.getAttribute('completionQuantity');
    ok(completionQuantity, 'and it should have a completionQuantity attribute');
    equal(completionQuantity, 1, 'that should equal 1');

    var isForCompensation = task.getAttribute('isForCompensation');
    ok(isForCompensation, "and it should have an isForCompensation attribute");
    equal(isForCompensation, 'false', "which is set to false");

    var taskName = task.getAttribute('name');
    ok(taskName, "it should have a name attribute");
    equal(taskName, "[" + this.component1.annotation + "] " + this.component1.name, 'that is set to the component annotation and name');

    var startQuantity = task.getAttribute('startQuantity');
    ok(startQuantity, "it should also have a startQuantity attribute");
    equal(startQuantity, "1", "that is equal to 1");

    var taskID = task.getAttribute('id');
    ok(taskID, "it should also have an ID attribute");
    equal(taskID, this.component1.id, 'that is equal to the component ID');
  });

  test('incoming/outgoing', function() {
    console.log(this.$bpmn);
    var self = this,
        $tasks = this.$bpmn.find('scriptTask'),
        $start = this.$bpmn.find('startEvent'),
        $end = this.$bpmn.find('endEvent');

    $tasks.each(function () {
      var $task = $(this),
          $incoming = $task.find('incoming'),
          $outgoing = $task.find('outgoing'),
          $inSeqFlow = self.$bpmn.find('sequenceFlow[targetRef="' + $task.attr('id') + '"]'),
          $outSeqFlow = self.$bpmn.find('sequenceFlow[sourceRef="' + $task.attr('id') + '"]');

      equal($incoming.length, 1, "every script task should have an incoming element");
      equal($outgoing.length, 1, "every script task should have an outgoing element");

      equal($incoming.text(), $inSeqFlow.attr('id') , "the incoming value should be equal to the sequence flow ID that references this script task in its targetRef attribute");
      equal($outgoing.text(), $outSeqFlow.attr('id'), "the outgoing value should be equal to the sequence flow ID that references this task in its sourceRef attribute");
    });

    $start.each(function () {
      equal($(this).find('outgoing').length, 1, "start events should have an outgoing element");
      equal($(this).find('incoming').length, 0, "but no incoming element");
    });

    $end.each(function () {
      equal($(this).find('incoming').length, 1, "the end event should have an incoming element");
      equal($(this).find('outgoing').length, 0, "and no outgoing element");
    });
  });

  test('BPMN ioSpecification', function() {
    var self = this,
        $outIO = this.$bpmn.find('scriptTask[id="' + this.component1.id + '"]').find('ioSpecification'),
        $inIO = this.$bpmn.find('scriptTask[id="' + this.component2.id + '"]').find('ioSpecification'),
        $noIO = this.$bpmn.find('scriptTask[id="' + this.component3.id + '"]').find('ioSpecification');
    console.log($outIO);
    equal($outIO.length, 1, "a scriptTask with specified IO linking should have an ioSpecification element");
    equal($inIO.length, 1, "a scriptTask with specified IO linking should have an ioSpecification element");
    equal($noIO.length, 0, "but a scriptTask with no specified IO shouldnt have an ioSpecification element");

    $([$outIO, $inIO]).each(function () {
      var $io = $(this);
      equal($io.find('inputSet').length, 1, 'an ioSpecification should have an inputSet element');
      equal($io.find('outputSet').length, 1, 'an ioSpecification should have an outputSet element');
    });

    var $dataOut = $outIO.find('dataOutput');
    equal($dataOut.length, 1, "an ioSpecification should have 1 dataOutput element for every connected output");
    equal($outIO.find('dataInput').length, 0, "an ioSpecification should not have a dataInput element if it has no connected inputs");

    var $dataIn = $inIO.find('dataInput');
    equal($dataIn.length, 1, "an ioSpecification should have 1 dataInput element for every connected input");
    equal($inIO.find('dataOutput').length, 0, "an ioSpecification should not have a dataOutput if it has no connected outputs");
  });

  test('BPMN dataOutput', function() {
    var self = this,
        $outIO = this.$bpmn.find('scriptTask[id="' + this.component1.id + '"]').find('ioSpecification');

    var $dataOuts = $outIO.find('dataOutput');

    $dataOuts.each(function (index) {
      var $dataOut = $(this);
      ok($dataOut.attr('id'), 'a dataOutput element should have an ID attribute');
      equal($dataOut.attr('id'), self.component1._outputs[index].id, "that is equal to the ID of the output");

      ok($dataOut.get(0).getAttribute('isCollection'), 'it should also have an isCollection attribute');
      equal($dataOut.get(0).getAttribute('isCollection'), 'false', 'that is equal to false');

      ok($dataOut.attr('name'), 'and a name attribute');
      equal($dataOut.attr('name'), self.component1._outputs[index].name, "that is equal to the output name");
    });

  });

  test('BPMN dataInput', function() {
    var self = this,
        $inIO = this.$bpmn.find('scriptTask[id="' + this.component2.id + '"]').find('ioSpecification');

    var $dataIns = $inIO.find('dataInput');

    $dataIns.each(function (index) {
      var $dataIn = $(this);
      ok($dataIn.attr('id'), 'a dataInput element should have an ID attribute');
      equal($dataIn.attr('id'), self.component2._inputs[index].id, "that is equal to the ID of the input");

      ok($dataIn.get(0).getAttribute('isCollection'), 'it should also have an isCollection attribute');
      equal($dataIn.get(0).getAttribute('isCollection'), 'false', 'that is equal to false');

      ok($dataIn.attr('name'), 'and a name attribute');
      equal($dataIn.attr('name'), self.component2._inputs[index].name, "that is equal to the input name");
    });

  });

  test('BPMN outputSet', function() {
    console.log(this.$bpmn);
    var self = this,
        $outIO = this.$bpmn.find('scriptTask[id="' + this.component1.id + '"]').find('ioSpecification'),
        $set = $outIO.find('outputSet');

    equal($set.find('dataOutputRefs').length, 1, 'an outputSet should have the same number of dataOutputRefs as connected outputs');
    equal($outIO.find('inputSet').children().length, 0, 'an inputSet should be empty if there are no connected inputs');
    $set.find('dataOutputRefs').each(function (index) {
      var $ref = $(this);
      equal($ref.text(), self.component1._outputs[index].id, 'the value of a dataOutputRefs element should be the ID of an output');
    });

  });

  test('BPMN inputSet', function() {
    console.log(this.$bpmn);
    var self = this,
        $inIO = this.$bpmn.find('scriptTask[id="' + this.component2.id + '"]').find('ioSpecification'),
        $set = $inIO.find('inputSet');

    equal($set.find('dataInputRefs').length, 1, 'an inputSet should have the same number of dataInputRefs as connected inputs');
    equal($inIO.find('outputSet').children().length, 0, 'an outputSet should be empty if there are no connected inputs');
    $set.find('dataInputRefs').each(function (index) {
      var $ref = $(this);
      equal($ref.text(), self.component2._inputs[index].id, 'the value of a dataInputRefs element should be the ID of an input');
    });
  });

  test('BPMN dataObject', function () {
    var self = this,
        $dos = this.$bpmn.find('dataObject');
    console.log(this.$bpmn);
    equal($dos.length, 1, "there should be a dataObject element for each connection");

    $dos.each(function (index) {
      var $do = $(this);

      ok($do.attr('id'), 'a dataObject should have an ID attribute');
      equal(self.$bpmn.find('[id="' + $do.attr('id') + '"]').length, 1, 'that is unique');

      ok($do.get(0).getAttribute('isCollection'), "and it should have an isCollection attribute");
      equal($do.get(0).getAttribute('isCollection'), 'false', 'that is false');

      ok($do.attr('name'), 'and a name attribute');
      equal($do.attr('name'), 'ParameterName', 'that is equal to ParameterName');

    });

  });

  test('BPMN dataObjectReference', function () {
    var self = this,
        $dors = this.$bpmn.find('dataObjectReference');
    console.log(this.$bpmn);
    equal($dors.length, 1, "there should be a dataObjectReference element for each connection");

    $dors.each(function (index) {
      var $dor = $(this);

      ok($dor.get(0).getAttribute('dataObjectRef'), 'a dataObjectReference should have a dataObjectRef attribute');
      equal(self.$bpmn.find('dataObject[id="' + $dor.get(0).getAttribute('dataObjectRef') + '"]').length, 1, 'that references a dataObject element');

      ok($dor.attr('id'), 'it should also have an ID attribute');

    });
  });

  test("BPMN dataOutputAssociation", function () {
    console.log(this.$bpmn);
    var self = this,
        $outIO = this.$bpmn.find('scriptTask[id="' + this.component1.id + '"]'),
        $doas = $outIO.find('dataOutputAssociation');

    equal($doas.length, 1, 'a scriptTask should have a dataOutputAssociation for every connected output');

    $doas.each(function (index) {
      var $doa = $(this);

      ok($doa.attr('id'), 'a dataOutputAssociation should have an ID attribute');
      equal(self.$bpmn.find('[id="' + $doa.attr('id') + '"]').length, 1, 'that is unique');

      equal($doa.find('sourceRef').length, 1, 'and it should have a sourceRef child');
      equal($doa.find('targetRef').length, 1, 'and a targetRef child');

      equal($doa.find('sourceRef').text(), self.component1._outputs[index].id, 'the sourceRef value should be the same as the output ID');
      var targetRef = $doa.find('targetRef').text();
      equal(self.$bpmn.find('dataObjectReference[id="' + targetRef + '"]').length,1, 'that references a dataObjectReference');
    });
  });

  test('BPMN dataInputAssociation', function() {
    console.log(this.$bpmn);
    var self = this,
        $inIO = this.$bpmn.find('scriptTask[id="' + this.component2.id + '"]'),
        $dias = $inIO.find('dataInputAssociation');

    equal($dias.length, 1, 'a scriptTask should have a dataInputAssociation for every connected input');

    $dias.each(function (index) {
      var $dia = $(this);

      ok($dia.attr('id'), 'a dataInputAssociation should have an ID attribute');
      equal(self.$bpmn.find('[id="' + $dia.attr('id') + '"]').length, 1, 'that is unique');

      equal($dia.find('sourceRef').length, 1, 'and it should have a sourceRef child');
      equal($dia.find('targetRef').length, 1, 'and a targetRef child');

      var sourceRef = $dia.find('sourceRef').text();
      equal(self.$bpmn.find('dataObjectReference[id="' + sourceRef + '"]').length, 1, 'the sourceRef value should reference a dataObjectReference element');
      // var targetRef = $dia.find('targetRef').text();
      equal($dia.find('targetRef').text(), self.component2._inputs[index].id, 'and the targetRef value should be the ID of the connected input');
    });
  });

  test("BPMN sequence flow", function () {
    var self = this,
        startID = self.$bpmn.find('startEvent').attr('id'),
        endID = self.$bpmn.find('endEvent').attr('id');
    // console.log(new XMLSerializer().serializeToString(bpmn));
    console.log(this.$bpmn);

    // Sequence flow
    var $sequences = this.$bpmn.find('sequenceFlow');
    ok($sequences.length, "A workflow should have at least 1 sequenceFlow element");
    equal($sequences.length, 6, "actually it should have 1 for each child plus 1 to start");

    var startSeq = $sequences.filter(function (index) {
      return this.getAttribute('sourceRef') == startID;
    });

    var endSeq = $sequences.filter(function (index) {
      return this.getAttribute('targetRef') == endID;
    });

    ok(startSeq.length == 1, "There should be a single sequenceFlow from the start event");

    ok(endSeq.length == 1, "and a single sequenceFlow going to the end event");

    ok(startSeq.get(0).getAttribute('targetRef') != endID, "The start event cannot route to the end event");

    for (var i = 0; i < this.workflow.length; i++) {
      var id = this.workflow[i].id;
      ok(this.$bpmn.find('sequenceFlow[sourceRef="'+id+'"]').length == 1, "there should be a sourceRef for each component");
      ok(this.$bpmn.find('sequenceFlow[targetRef="'+id+'"]').length == 1, "there should also be a targetRef for each component");
    }
  });

  test('BPMN nested workflows', function() {
    var w1 = new UncertWeb.Workflow(),
        c1 = generateComponent(),
        w2 = new UncertWeb.Workflow(),
        c2 = generateComponent();

    w1.append([c1, w2]);
    w2.append(c2);

    var bpmn = UncertWeb.Encode.asBPMN(w1),
        $bpmn = $(bpmn);

    var $process = $bpmn.children('process').eq(0),
    process = $process.get(0),
    $tasks = $process.children('scriptTask'),
    $subProcesses = $process.children('subProcess');

    equal($tasks.length, 1, "Nested workflows should not create scriptTask elements");
    equal($subProcesses.length, 1, "but they should create a subProcess element");

    var $sp = $subProcesses.eq(0),
        sp = $sp.get(0);

    ok(sp.getAttribute('completionQuantity'), "A subProcess should have a completionQuantity attribute");
    equal(sp.getAttribute('completionQuantity'), "1", "that is equal to 1");

    ok($sp.attr('id'), 'it should also have an ID');
    equal($sp.attr('id'), w2.id, 'that is equal to the nested workflow ID');

    ok(sp.getAttribute('isForCompensation'), "it should also have an isForCompensation attribute");
    equal(sp.getAttribute('isForCompensation'), 'false', 'that is equal to false');

    ok($sp.attr('name'), 'it should also have a name attribute');
    // TODO implement names here...

    ok(sp.getAttribute('startQuantity'), "it should also have a startQuantity attribute");
    equal(sp.getAttribute('startQuantity'), '1', 'that is equal to 1');

    ok(sp.getAttribute('triggeredByEvent'), 'it should also have a triggeredByEvent attribute');
    equal(sp.getAttribute('triggeredByEvent'), 'false', 'that is equal to false');

    var nestedEnd = $sp.find('endEvent');
    equal(nestedEnd.find('terminateEventDefinition').length, 0, "A nested end event does not have a terminateEventDefinition child");

    var $loopChars = $sp.find('multiInstanceLoopCharacteristics').eq(0),
        loopChars = $loopChars.get(0);
    ok($loopChars.length, "A subProcess should have a multiInstanceLoopCharacteristics child");

    ok(loopChars.getAttribute('behavior'), "A multiInstanceLoopCharacteristics should have a behaviour attribute");
    equal(loopChars.getAttribute('behavior'), 'All', 'that is equal to All');

    ok(loopChars.getAttribute('isSequential'), 'it should also have an isSequential attribute');
    equal(loopChars.getAttribute('isSequential'), 'false', 'that is equal to false');

    var ldir = $loopChars.find('loopDataInputRef').eq(0);
    ok(ldir.length, "it should have a loopDataInputRef child");
    equal(ldir.text(), w2.id + "_input", "whose value is equal to the nested workflow ID + _input");

    var idi = $loopChars.find('inputDataItem').eq(0);
    ok(idi.length, "and an inputDataItem child");
    ok(idi.get(0).getAttribute('isCollection'), "which has an isCollection attribute");
    equal(idi.get(0).getAttribute('isCollection'), "false", "whose value is false");

    var odi = $loopChars.find('outputDataItem').eq(0);
    ok(odi.length, "and an outputDataItem child");
    ok(odi.get(0).getAttribute('isCollection'), "which has an isCollection attribute");
    equal(odi.get(0).getAttribute('isCollection'), "false", "whose value is false");
  });

  test('eHabitat BPMN example', function() {

    var workflow = generateEHabitat();

    // create the BPMN
    var bpmn = UncertWeb.Encode.asBPMN(workflow),
        $bpmn = $(bpmn);

    console.log(bpmn);

    ok(bpmn, "It should at least do something!");
    equal($bpmn.find('process').length, 1, "There should be 1 process element");
    equal($bpmn.find('scriptTask').length, 10, "There should be 10 scriptTask elements");
    equal($bpmn.find('subProcess').length, 2, "There should be 2 subProcess elements");
    equal($bpmn.find('sequenceFlow').length, 15, "There should be 15 sequenceFlow elements");
    equal($bpmn.find('startEvent').length, 3, "There should be 3 startEvent elements");
    equal($bpmn.find('endEvent').length, 3, "There should be 3 endEvent elements");
    equal($bpmn.find('itemDefinition').length, 2, "There should be 2 itemDefinition elements");

  });

  test('FERA BPMN example', function () {
    stop();
    generateFERA().done(function (workflow) {
      var bpmn = UncertWeb.Encode.asBPMN(workflow),
          $bpmn = $(bpmn);
      start();
      ok(bpmn, "It should at least do something!");
      equal($bpmn.find('process').length, 1, "There should be 1 process element");
      equal($bpmn.find('scriptTask').length, 4, "There should be 4 scriptTask elements");
      equal($bpmn.find('subProcess').length, 1, "There should be 1 subProcess element");
      equal($bpmn.find('sequenceFlow').length, 7, "There should be 7 sequenceFlow elements");
      equal($bpmn.find('startEvent').length, 2, "There should be 2 startEvent elements");
      equal($bpmn.find('endEvent').length, 2, "There should be 2 endEvent elements");
      equal($bpmn.find('itemDefinition').length, 1, "There should be 2 itemDefinition elements");
    });



  });

  test("FERA IO BPMN example", function () {
    stop();
    generateFERA().done(function (workflow) {
      var bpmn = UncertWeb.Encode.asBPMN(workflow),
          $bpmn = $(bpmn);
      start();
      ok(bpmn, "It should at least do something!");
      equal($bpmn.find('dataInput').length, 8, "There should be 8 dataInput elements");
    });

  });


  module('CaaS', {
    setup: function () {
      var self = this;
      stop();
      var w = new UncertWeb.Workflow(),
          w2 = new UncertWeb.Workflow(),
          c,
          c2,
          c3;

      UncertWeb.broker.all().done(function (results) {
        c = new UncertWeb.Component(results.results[0]);
        c2 = new UncertWeb.Component(results.results[1]);
        c3 = new UncertWeb.Component(results.results[2]);
        w2.append(c3);

        c._inputs = [{
          id: UncertWeb.uid(),
          name: "TEST input",
          component: c
        }];

        c2._inputs = [{
          id: UncertWeb.uid(),
          name: "TEST input",
          component: c2
        }, {
          id: UncertWeb.uid(),
          name: "TEST input 2",
          component: c2
        }];

        c3._inputs = [{
          id: UncertWeb.uid(),
          name: "TEST input",
          component: c3
        }];

        c._outputs = [{
          id: UncertWeb.uid(),
          name: "TEST output",
          component: c
        }, {
          id: UncertWeb.uid(),
          name: "TEST output 2",
          component: c
        }];

        c2._outputs = [{
          id: UncertWeb.uid(),
          name: "TEST output",
          component: c2
        }];
        c3._outputs = [{
          id: UncertWeb.uid(),
          name: "TEST output",
          component: c3
        }];

        c.connect(c._outputs[0], c2._inputs[0]);
        c.connect(c._outputs[1], c2._inputs[1]);
        // c.connect(c._outputs[0], c2._inputs[1]);
        w.append([c, c2, w2]);
        self.workflow = w;
        start();
      });
    }
  });

  test("CaaS interface", function () {
    ok(UncertWeb.CaaS, "CaaS should exist");
    ok(UncertWeb.CaaS.publish, "and it should have a publish property");
    ok(UncertWeb.isFunction(UncertWeb.CaaS.publish), "... that is a function");
  });

  test('CaaS failure', function() {
    stop(2);
    expect(4);

    var promise = UncertWeb.CaaS.publish(undefined),
        ehabitat = generateEHabitat();

    promise.fail(function () {
      ok(true, "A publish request should fail without a workflow");
      ok(arguments.length > 0, "and it should return the underlying problem");
    }).always(function () {
      start();
    });

    UncertWeb.CaaS.publish(ehabitat, undefined).fail(function () {
      ok(true, "A publish request should also fail when a valid workflow is sent without metadata");
      ok(arguments.length > 0, "with the error arguments");
    }).always(function () {
      start();
    });
  });

  test('CaaS success', function () {
    stop(2);
    expect(2);

    var eHabitat = generateEHabitat(),
        promise;


    UncertWeb.CaaS.publish(eHabitat, {
      title: "My new workflow",
      description: "This is just a test workflow to ensure the client is working correctly",
      organisation: "Aston University"
    }).done(function (result) {
      ok(true, "Publishing a valid BPMN with metadata should work");
    }).always(function () {
      start();
    });

    generateFERA().done(function (fera) {
      console.log(fera);
      UncertWeb.CaaS.publish(fera, {
        title: "FERA",
        description: "Auto-generated FERA workflow for testing",
        organisation: "Aston University"
      }).done(function (result) {
        ok(true, "Publishing a valid BPMN FERA example should work");
      }).always(function () {
        start();
      });
    });


  });

  test('CaaS publication with IO', function() {
    stop();
    expect(1);

    var promise = UncertWeb.CaaS.publish(this.workflow, {
      title: 'IO Workflow',
      description: 'Simple workflow with IO linking',
      organisation: 'Aston University'
    });

    promise.done(function (result) {
      ok(true, "Publishing a BPMN with IO linking should work");
    }).always(function () {
      start();
    });
  });

  module("IO", {
    setup: function () {
      stop();
      var self = this;
      UncertWeb.broker.all().done(function (results) {
        self.component = new UncertWeb.Component(results.results[0]);
        self.component2 = new UncertWeb.Component(results.results[1]);
        self.disconnected = new UncertWeb.Component(results.results[2]);
        self.workflow = new UncertWeb.Workflow().append([self.component, new UncertWeb.Workflow().append(self.component2)]);
        start();
      });
    }
  });

  test('IO structure', function() {
    ok(this.component.inputs(), "A component should have inputs");
    ok(this.component.outputs(), "and it should have outputs");
    ok(this.component.inputs().length !== undefined, "inputs should have a length");
    ok(this.component.outputs().length !== undefined, "outputs should have a length");
  });

  test('IO object', function() {
    var input = this.component._inputs[0];
    var output = this.component._outputs[0];
    ok(UncertWeb.isObject(input), "an input should be an object");
    ok(UncertWeb.isObject(output), "an output should be an object");

    ok(input.id, "an input should have an id");
    ok(UncertWeb.isString(input.id), "which is a string");

    ok(input.name, "an input should also have a name");
    ok(UncertWeb.isString(input.name), "that is a string");

    ok(input.description, "an input should also have a description");
    ok(UncertWeb.isString(input.description), "that is a string");

    ok(output.id, "an output should have an id");
    ok(UncertWeb.isString(output.id), "which is a string");

    ok(output.name, "an output should also have a name");
    ok(UncertWeb.isString(output.name), "that is a string");

    ok(output.description, "an output should also have a description");
    ok(UncertWeb.isString(output.description), "that is a string");

    ok(input.component, "an input should have a reference to its component");
    equal(input.component, this.component, "that is equal to the component it belongs to");
  });

  test("IO connections", function () {
    var connections = this.component.connections;
    ok(connections, "a component should have connections");
    ok(connections.length !== undefined, "that has a length");
    equal(connections.length, 0, "that is initially zero");
  });

  test("Creating a connection between an output and input object", function () {
    var output = this.component._outputs[0];
    var input = this.component2._inputs[0];
    ok(this.component.connect, "A component should have a connect property");
    ok(UncertWeb.isFunction(this.component.connect), "that is a function");

    this.component.connect(output, input);

    var connections = this.component.connections;
    equal(connections.length, 1, "connecting an output and input should add a connection");
    equal(this.component2.connections.length, 1, "connecting also creates a connection on the other component");
    ok(UncertWeb.isObject(connections[0]), "a connection should be an object");

    ok(connections[0].output, "with an output property");
    equal(connections[0].output, output, "That is equal to the output supplied in connect");

    ok(connections[0].input, "a connection should also have an input property");
    equal(connections[0].input, input, "that is equal to the input supplied in connect");
  });

  test("Creating a connection between an ouput ID and an input ID", function () {
    var output = this.component._outputs[0];
    var input = this.component2._inputs[0];
    ok(this.component.connect, "A component should have a connect property");
    ok(UncertWeb.isFunction(this.component.connect), "that is a function");

    this.component.connect(output.id, input.id);

    var connections = this.component.connections;
    equal(connections.length, 1, "connecting an output and input should add a connection");
    ok(UncertWeb.isObject(connections[0]), "a connection should be an object");

    ok(connections[0].output, "with an output property");
    equal(connections[0].output, output, "That is equal to the output supplied in connect");

    ok(connections[0].input, "a connection should also have an input property");
    equal(connections[0].input, input, "that is equal to the input supplied in connect");
  });

  test("Finding connections between components", function () {
    var connectedTo = this.component.connectedTo;
    this.component.connect(this.component._outputs[0], this.component2._inputs[0]);
    this.component.connect(this.component._outputs[0], this.component2._inputs[1]);

    ok(connectedTo, "A component should provide a connectedTo attribute");
    ok(UncertWeb.isFunction(connectedTo), "that is a function");

    equal(this.component.connectedTo(this.component2), true, "that should return true when connected");
    equal(this.component2.connectedTo(this.component), true, "and it should work in the reverse direction");
    equal(this.component.connectedTo(this.disconnected), false, "and false when not");

    ok(UncertWeb.isArray(this.component.connectedTo()), "Calling connectedTo with no paramter should return an array of components");
    equal(this.component.connectedTo().length, 1, "and it should contain the correct number of components");
    equal(this.component.connectedTo()[0], this.component2, "and the list should contain the component to which it is connected");
    equal(this.component2.connectedTo().length, 1, "the connectedTo function should work both ways");
    equal(this.component2.connectedTo()[0], this.component, "the connectedTo function should work both ways");

    ok(this.component.connectionsTo, "a component should have a connectionsTo attribute");
    ok(UncertWeb.isFunction(this.component.connectionsTo), "that is a function");
    ok(UncertWeb.isArray(this.component.connectionsTo()), "that returns an array");
    equal(this.component.connectionsTo(this.component2).length, 2, "that has the correct number of connections");
    equal(this.component2.connectionsTo(this.component).length, 2, "and it works both ways");

    equal(this.component.connectionsTo(this.component).length, 0, "no connections should exist between the same component");
  });

  test("Finding connected outputs", function () {
    this.component.connect(this.component.outputs()[0], this.component2.inputs()[0]);

    equal(this.component.outputs().length, 2, "outputs with no parameter should return all outputs");
    equal(this.component.outputs(true).length, 1, "outputs with true supplied returns only those outputs that are connected");
    equal(this.component.outputs(true)[0], this.component._outputs[0], "and it should return the connected output");
  });

  test("Finding connected inputs", function () {
    this.component.connect(this.component.inputs()[0], this.component2.inputs()[0]);

    equal(this.component2.inputs().length, 2, "inputs with no parameter should return all inputs");
    equal(this.component2.inputs(true).length, 1, "inputs with true supplied returns only those inputs that are connected");
    equal(this.component2.inputs(true)[0], this.component2._inputs[0], "and it should return the connected input");
  });

  test("Disconnecting components by connection", function () {
    var disconnect = this.component.disconnect;
    this.component.connect(this.component._outputs[0], this.component2._inputs[0]);

    ok(disconnect, "a component should have a disconnect attribute");
    ok(UncertWeb.isFunction(disconnect), "that is a function");

    equal(this.component.connections.length, 1, "A connection is established");
    equal(this.component2.connections.length, 1, "on both sides");
    this.component.disconnect(this.component.connections[0]);

    equal(this.component.connections.length, 0, "And when disconnected it is removed");
    equal(this.component2.connections.length, 0, "from both sides");

  });

  test('Disconnectiong components by component', function() {
    this.component.connect(this.component._outputs[0], this.component2._inputs[0]);
    this.component2.connect(this.component2._outputs[1], this.component._inputs[0]);
    equal(this.component.connections.length, 2, "A connection is established");
    equal(this.component2.connections.length, 2, "on both sides");
    this.component2.disconnect(this.component2.connections[0]);

    equal(this.component.connections.length, 1, "And when disconnected it is removed");
    equal(this.component2.connections.length, 1, "from both sides");

    this.component.connect(this.component._outputs[0], this.component2._inputs[0]);

    equal(this.component.connections.length, 2, "A connection is established");
    equal(this.component2.connections.length, 2, "on both sides");

    this.component.disconnect(this.component2);

    equal(this.component.connections.length, 0, "All connections to a component are removed");
    equal(this.component2.connections.length, 0, "on both sides");
  });

  test('Disconnection all connections of a component', function() {
    this.component.connect(this.component._outputs[0], this.component2._inputs[0]);
    this.component2.connect(this.component2._outputs[1], this.component._inputs[0]);

    equal(this.component.connections.length, 2, "A connection is established");
    equal(this.component2.connections.length, 2, "on both sides");

    this.component.disconnect();

    equal(this.component.connections.length, 0, "calling disconnect() with no paramters removes all connections");
  });

}());