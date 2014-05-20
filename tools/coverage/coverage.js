var applicationState = (function() {
    var usingPopState = false;
    
    function pushState(state) {
        if (window.history && window.history.pushState) {
            usingPopState = true;
            window.history.pushState(null, '', getUrlFromState(state));
        }
    }
    window.onpopstate = function(event) {
        if (usingPopState && self.onstatechange) self.onstatechange(getStateFromUrl());
    }

    function getStateFromUrl() {
        return (window.location.href.split('?')[1] || '').split('&').reduce(function(obj, str) {
            if (str) {
                str = str.split('=');
                obj[str[0]] = str[1] || true;                
            }
            return obj;
        }, {});
    }
    
    function getUrlFromState(state) {
        return location.pathname + "?" + Object.keys(state).sort().filter(function(k) { return state[k] }).map(function(k) {
            var v = state[k];
            return v === true ? k : k + "=" + v;
        }).join('&');
    }
    
    var self = {
        getStateFromUrl: getStateFromUrl,
        getUrlFromState: getUrlFromState,
        pushState: pushState,
        onstatechange: null
    };
    
    return self;
})();

var controls = (function($) {
    var self = {
        currentSpec: null,
        selectedSpecs: null,
        update: update,
        getState: getState,
        setLevel: setLevel,
        displayAllReqs: displayAllReqs,
        displayDetails: displayDetails
    };
    
    
    function displayAllReqs(bool) {
        $("body").toggleClass("hide-no-reqs", !bool);
    }
    
    function displayDetails(bool) {
        $("body").toggleClass("hide-details", !bool);
    }
    
    function setViewType(spec) {
        $("body").toggleClass("spec-view", !!spec);
        $("body").toggleClass("summary-view", !spec);
    }
    
    function setLevel(lvl) {
         var $body = $('body');
         if (lvl == 1) {
             $body.addClass('hide-level-2');
             $body.addClass('hide-level-3');
         } else if (lvl == 2) {
             $body.removeClass('hide-level-2');
             $body.addClass('hide-level-3');
         } else {
             $body.removeClass('hide-level-2');
             $body.removeClass('hide-level-3');
         }
    }
    
    function update(state) {
        self.currentSpec = state.spec;
        if (state.specs) {
            self.selectedSpecs = state.specs.split(',');
        }
        setViewType(state.spec);
        [
          "rfc2119",
          "algos",
          "idl",
          "assume-idl",
          "assume-tooling",
          "review-time",
          "test-time",
          "propdef",
          "review-success",
          "reftest-factor"
        ].forEach(function(k) {
            if (k in state) {
                $("input[name=" + k + "]").val(state[k]);
            }
        });

        var lvl = state.level || 1;
        $("input[name=level][value=" + lvl + "]").get(0).checked = true;
        self.setLevel(lvl);

        var showAll = !!state['show-all'];
        self.displayAllReqs(showAll);
        $('#show-all').get(0).checked = showAll;

        var showDetails = !!state['show-details']
        self.displayDetails(showDetails);
        $('#show-details').get(0).checked = showDetails;

        $("#sort-by").get(0).selectedIndex = state['sort-by'] == 'status' ? 1 : 0;
    }

    function getState() {
        var output = $('#form').serializeArray().reduce(function(obj, input) {
            if (input.name == "show-details" || input.name == "show-all") {
                obj[input.name] = true;
            } else {
                obj[input.name] = input.value;
            }
            return obj;
        }, {});

        if (self.currentSpec) {
            output.spec = self.currentSpec;
        }
        
        if (self.selectedSpecs) {
            output.specs = self.selectedSpecs ? self.selectedSpecs.join(',') : null;
        }
        return output;
    }
    
    return self;
})(jQuery);

function View(model) {
    this.model = model;
    this.existingTests = 0;
    this.missingTests = 0;
    this.desiredTests = 0;
    this.exceedingTests = 0;
    this.maxDesiredTests = 0;
    this.testsAwaitingReview = 0;
    this.testsPassingReview = 0;
    this.testTime = 0;
    this.reviewTime = 0;
    this.totalTime = 0;
    this.children = [];
}

View.maxDesiredTests = 0; // :(

View.calculateTotals = function(obj, item) {
    obj.missingTests += item.missingTests || 0;
    obj.desiredTests += item.desiredTests || 0;
    obj.existingTests += item.existingTests || 0;
    obj.exceedingTests += item.exceedingTests || 0;
    obj.testsAwaitingReview += item.testsAwaitingReview || 0;
    obj.testsPassingReview += item.testsPassingReview || 0;
    if (item.desiredTests > View.maxDesiredTests) {
        View.maxDesiredTests = item.desiredTests;
    }
    obj.testTime += item.testTime || 0;
    obj.reviewTime += item.reviewTime || 0;
    obj.totalTime += item.totalTime || 0;
    return obj;
};

function SpecModel(specs) {
    this._specArray = specs;
    this._data = {};
    this._specs = {};
    specs.forEach(function(spec) {
        this.setSpec(spec.shortName, spec);
    }, this);
}

SpecModel.prototype.setData = function(shortName, data) {
    this._data[shortName] = data;
};

SpecModel.prototype.getData = function(shortName) {
    return this._data[shortName];
};

SpecModel.prototype.setSpec = function(shortName, spec) {
    this._specs[shortName] = spec;
};

SpecModel.prototype.getSpec = function(shortName) {
    return this._specs[shortName];
};

SpecModel.prototype.getCurrentSpec = function() {
    return this._specs[controls.currentSpec];
};

SpecModel.prototype.findAll = function() {
    return this._all = this._all || this._specArray.filter(function(s) {
        return s.publisher === "W3C" && !s.insufficientData &&
            (!controls.selectedSpecs || controls.selectedSpecs.indexOf(s.id) > -1);
    });
};

SpecModel.prototype.findMissingData = function() {
    return this._missingData = this._missingData || this._specArray.filter(function(s) {
        return s.insufficientData &&
            (!controls.selectedSpecs || controls.selectedSpecs.indexOf(s.id) > -1);;
    });
};

SpecModel.prototype.findOutOfScope = function() {
    return this._outScope = this._outScope || this._specArray.filter(function(s) {
        return s.publisher !== "W3C" &&
            (!controls.selectedSpecs || controls.selectedSpecs.indexOf(s.id) > -1);;
    });
};

(function ($) {

    var specs = null;
    var $target = null;
    var STATUS_VALUES = {
        "ED": 0,
        "FPWD": 1,
        "WD": 2,
        "LCWD": 3,
        "CR": 4,
        "PR": 5,
        "REC": 6
    };
    
    function clone(obj) {
        var r = {};
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                r[k] = obj[k];
            }
        }
        return r;
    }
    
    var templates = (function ($) {
        
        Handlebars.registerHelper('formatNumber', function(num, option) {
            if (num == null) return 'n/a';
            num = (num + "");
            if (num.length > 3) {
              num = num.replace(/\B(?=(?:\d{3})+(?!\d))/g, ',');
            }
            return num;
        });
        
        
        function allowHalfs(num) {
            return Math.round(((num % 1) + Math.floor(num)) * 2) / 2;
        }
        
        Handlebars.registerHelper('formatTime', function(time) {
            var H = 60, D = 5 * H, W = 5 * D, Y = 50 * W, M = Y / 12;
            if (time < H) {
                return "1hr";
            }

            if (time < D) {
                return allowHalfs(time / H) + "hr";
            }

            if (time < W) {
                return allowHalfs(time / D) + "d";
            }

            if (time < 6 * W) {
                return allowHalfs(time / W) + "wk";
            }

            if (time < 11 * M) {
                return allowHalfs(time / M) + "mo";
            }

            return allowHalfs(time / Y) + "yr";
        });

        Handlebars.registerHelper('percentToValue', function(percent) {
            if (percent == null) return '';
            if (percent > 79) return 'high';
            if (percent > 59) return 'med-high';
            if (percent > 39) return 'med';
            if (percent > 19) return 'med-low';
            return 'low';
        });

        Handlebars.registerHelper('lowerCase', function(str) {
            return str.toLowerCase();
        });
        
        return {
            spec: Handlebars.compile($("#table-template").html()),
            summary: Handlebars.compile($("#summary-template").html()),
            otherSpecs: Handlebars.compile($("#other-specs-template").html())
        }
    })(jQuery);
    

    $("input[name=level]").click(function() {
        controls.setLevel(1 * $(this).val());
        applicationState.pushState(controls.getState());
    });
    
    $("#form").submit(function(e) {
        e.preventDefault();
        var state = controls.getState();
        refreshApp(state);
        applicationState.pushState(state);
    });
    
    $("#show-all").click(function() {
        controls.displayAllReqs(this.checked);
        applicationState.pushState(controls.getState());
    });
    
    $("#show-details").click(function() {
        controls.displayDetails(this.checked);
        applicationState.pushState(controls.getState());
    });
    
    function calculatePercentage(existing, desired) {
        if (!desired) {
            return null;
        }
        return Math.min(Math.round((existing / desired) * 100), 100);
    }
    
    function calculateDesired(data, multipliers) {
        var output = 0;
        output += data.normativeStatements * multipliers.normativeStatements;
        output += data.algorithmicSteps * multipliers.algorithmicSteps;
        output += data.idlComplexity * multipliers.idlComplexity;
        output += data.propdef * multipliers.propdef;
        return output;
    }
    
    function calculateExisting(data, multipliers) {
        var output = data.tests || 0;
        output += Math.floor(multipliers.idlComplexity * data.idlComplexity * multipliers.assumeIdl / 100);
        return output;
    }
    
    function calculateReviewTime(missingTests, reviewTime, toolingPercent) {
        var total = reviewTime * missingTests;
        total -=  total * toolingPercent / 100;
        return total;
    }
    
    function calculateNumberOfTestsAwaitingReview(awaiting, desired) {
        if (typeof awaiting == 'object' && awaiting.type == "%") {
            awaiting = awaiting.value * desired / 100;
        }
        return Math.round(awaiting || 0);
    }
    
    function createBarGraph(item) {
        var containerW = item.desiredTests * 600 / View.maxDesiredTests;
        var barW = (item.percent || 0) * containerW / 100;
        var reviewW = Math.min(item.testsPassingReview / item.desiredTests * containerW, containerW - barW);
        
        item.progressBarValue = barW;
        item.progressBarTotal = containerW + 2;
        item.progressBarReviewValue = reviewW;
        item.progressBarReviewMargin = barW + 1;
    }
    
    function getMultipliers(spec) {
        var rTB = spec.refTestBased;
        var refTestFactor = 1 * $("input[name=reftest-factor]").val()
        return {
            normativeStatements: (rTB ? refTestFactor : 1 ) * $("input[name=rfc2119]").val(),
            algorithmicSteps: (rTB ? refTestFactor : 1) * $("input[name=algos]").val(),
            idlComplexity: 1 * $("input[name=idl]").val(),
            propdef: 1 * $("input[name=propdef]").val(),
            assumeIdl: 1 * $("input[name=assume-idl]").val(),
            assumeTooling: 1 * $("input[name=assume-tooling]").val(),
            reviewTime: 1 * $("input[name=review-time]").val(),
            testTime: 1 * $("input[name=test-time]").val(),
            reviewSuccess: 1 * $("input[name=review-success]").val(),
            sortBy: $("select[name=sort-by]").val()
        };
    }
    
    function getUrlForSpec(spec) {
        var state = controls.getState();
        state.spec = spec.shortName;
        return applicationState.getUrlFromState(state);
    }
    
    function makeViewFromSpecData(spec, data, multipliers) {
        var view = new View(spec);
        view.href = getUrlForSpec(spec);
        
        data.forEach(function(row) {
            var section = clone(row);
            section.href = section.url ? section.url : spec.href + '#' + row.original_id;
            section.name = section.original_id;
        
            var desired = calculateDesired(row, multipliers),
                existing = calculateExisting(row, multipliers);
                
            section.existingTests = existing;
            section.desiredTests = desired;
            section.missingTests = Math.max(0, desired - existing);
            section.exceedingTests = Math.max(0, existing - desired);
            section.percent = calculatePercentage(existing, desired);
        
            section.href = section.url ? section.url : spec.href + '#' + row.original_id;
            section.name = section.original_id;
            section.className = "level-" + section.level;
            if (!desired) section.className += ' no-req';
        
            view.children.push(section);
        });
        
        
        // We should do all the math looking at the leaves only.
        view.children.filter(function (s) { return s.level === 1; }).reduce(View.calculateTotals, view);
        
        // Now that we have maxDesiredTests we can build the graphs.
        view.children.forEach(createBarGraph);
        
        view.reviewTime = calculateReviewTime(view.missingTests, multipliers.reviewTime, multipliers.assumeTooling);
        view.testsAwaitingReview = calculateNumberOfTestsAwaitingReview(spec.testsAwaitingReview, view.desiredTests);
        view.testsPassingReview = Math.round(view.testsAwaitingReview * multipliers.reviewSuccess / 100);
        view.testTime = multipliers.testTime * Math.max(0, view.missingTests - view.testsPassingReview);
        view.totalTime = view.testTime + view.reviewTime;
        view.percent = calculatePercentage(view.desiredTests - view.missingTests, view.desiredTests);
        return view;
    }
    
    function getDataForSpec(spec, callback) {
        $.getJSON("spec-data-" + spec.shortName + ".json", function (data) {
            specs.setData(spec.shortName, data);
            callback(data);
        });
    }
    
    function makeViewFromSpecs(_specs, getData, callback) {
        var view = new View(),
            count = _specs.length;
    
        _specs.forEach(function(spec) {
            getData(spec, function(data) {
                count--;
                var multipliers = getMultipliers(spec);
                view.children.push(makeViewFromSpecData(spec, data, multipliers));
                if (count === 0) {
                    view.children.reduce(View.calculateTotals, view);
                    view.children.forEach(createBarGraph);
                    view.children.sort(function(a, b) {
                        a = a.model;
                        b = b.model;
                        if (multipliers.sortBy == "id" || a.status == b.status) return a.id > b.id ? 1 : -1;
                        return STATUS_VALUES[b.status] - STATUS_VALUES[a.status];
                    });
                    callback(view);
                }
            });
        });
        
    }
    
    function createOtherSpecList() {
        var output = '';
        var specsMissingData = specs.findMissingData();
        if (specsMissingData.length) {
            output += templates.otherSpecs({
                title: "Specs which are Missing Data",
                message: "We are currently lacking coverage info and reliable enough heuristics to estimate coverage for this spec.",
                children: specsMissingData
            });
        }

        var outOfScopeSpecs = specs.findOutOfScope();
        if (outOfScopeSpecs.length) {
            output += templates.otherSpecs({
                title: "Specs which are Out of Scope",
                message: "These specs are of relevance to this effort but aren't edited by W3C. We will not be authoring tests specifically for these at present. We might be running their test suites as part of this effort, license permitting.",
                children: outOfScopeSpecs
            });
        }
        return output;
    }
    
    function buildSummaryTable(getData) {
        var html = '';
        makeViewFromSpecs(specs.findAll(), getData, function(view) {
            html += templates.summary(view);
            html += createOtherSpecList();
            $target.html(html);
        });
    }
    
    function refreshApp(state) {
        View.makeViewFromSpecData = 0;
        if (state.spec) {
            var spec = specs.getSpec(state.spec);
            if (spec) {
                getDataForSpec(spec, function(data) {
                    var view = makeViewFromSpecData(spec, data, getMultipliers(spec));
                    $target.html(templates.spec(view));
                });
            } else {
                alert("This spec isn't listed: " + state.spec);
                delete state.spec; // enables fallback
                applicationState.pushState(state);
                controls.update(state);
                buildSummaryTable(getDataForSpec);
            }
        } else {            
            buildSummaryTable(getDataForSpec);
        }
    }
    
    window.cover = function (_specs, _$target) {
        specs = new SpecModel(_specs);
        $target = _$target;

        applicationState.onstatechange = function(state) {
            controls.update(state);
            refreshApp(state);
        };
        var state = applicationState.getStateFromUrl();
        controls.update(state);
        refreshApp(state);
    };
}(jQuery));

