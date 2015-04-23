(function () {
    function OrientationTest(container, orientation) {
        this.container = container;
        this.setOrientation(orientation);
    }
    OrientationTest.prototype.setOrientation = function (orientation) {
        this.orientation = orientation;
        if (orientation == "R") {
            this.advanceExpected = 8;
            this.advanceFailed = 4;
        } else {
            this.advanceExpected = 4;
            this.advanceFailed = 8;
        }
    };
    OrientationTest.prototype.measure = function () {
        var nodes = this.container.childNodes;
        for (var i = 0; i < nodes.length; i++)
            this._measureNode(nodes[i]);
    };
    OrientationTest.prototype._measureNode = function (node) {
        switch (node.nodeType) {
        case Node.ELEMENT_NODE:
            var nodes = node.childNodes;
            for (var i = 0; i < nodes.length; i++)
                this._measureNode(nodes[i]);
            return;
        case Node.TEXT_NODE:
            break;
        default:
            return;
        }

        var range = new Range();
        var text = node.textContent;
        for (var ich = 0; ich < text.length; ich++) {
            var code = text.charCodeAt(ich);
            if (code == 10 || code == 13)
                continue;
            range.setStart(node, ich);
            range.setEnd(node, ich + 1);
            rect = range.getBoundingClientRect();
            if (rect.width == 16) {
                if (rect.height == this.advanceExpected)
                    continue;
                //log("U+" + stringFromUnicode(code) + " " + rect.width + "x" + rect.height);
                if (rect.height == this.advanceFailed) {
                    this.results.failed(this, code);
                    continue;
                }
            }
            this.results.inconclusive(this, code, rect);
        }
    };

    function Results(name) {
        appendChildElement(details, "h3", name);
        this.list = appendChildElement(details, "ol");
        this.failCount = 0;
        this.inconclusiveCount = 0;
    }
    Results.prototype.failed = function (test, code) {
        this.failCount++;
        this.append(test, code);
    };
    Results.prototype.inconclusive = function (test, code, rect) {
        this.inconclusiveCount++;
        this.append(test, code, " but inconclusive (rendered as " + rect.width + "x" + rect.height + ")");
    };
    Results.prototype.append = function (test, code, message) {
        var text = stringFromUnicode(code) + " should be " + test.orientation;
        if (message)
            text += message;
        appendChildElement(this.list, "li", text);
    };
    Results.prototype.endTest = function (test) {
        var results = this;
        test.step(function () {
            if (results.inconclusiveCount)
                test.name += " (" + results.inconclusiveCount + " inconclusive)";
            assert_equals(results.failCount, 0, "Fail count");
            test.done();
        });
    };

    setup({explicit_done:true, explicit_timeout:true});
    var t = new OrientationTest(container, vo);
    t.test = async_test("Default orientation for vo=" + t.orientation);
    t.results = new Results(t.test.name);

    window.onload = function () {
        log("onload");
        if (document.fonts) {
            document.fonts.load("16px orientation").then(run);
        } else {
            document.offsetTop;
            run();
        }
    }

    function run() {
        log("Started");
        var start = new Date

        t.test.step(function () {
            t.measure();
        });
        t.results.endTest(t.test);

        runWithOrientation("U", "Orientation=Upright");
        runWithOrientation("R", "Orientation=Rotated");

        log("Elapsed " + (new Date() - start));
        done();
    }

    function runWithOrientation(orientation, name) {
        container.classList.add(orientation);
        var test = async_test(name);
        var results = new Results(name);
        test.step(function () {
            t.setOrientation(orientation);
            t.results = results;
            t.measure();
        });
        results.endTest(test);
        container.classList.remove(orientation);
    }

    function stringFromUnicode(code) {
        var hex = "0000" + code.toString(16).toUpperCase();
        hex = hex.substr(hex.length - 4);
        return hex + ' "' + String.fromCharCode(code) + '"';// + '" (' + gcFromCode[code] + ")";
    }

    function appendChildElement(parent, tag, text) {
        var node = document.createElement(tag);
        if (text)
            node.textContent = text;
        parent.appendChild(node);
        return node;
    }

    function log(text) {
        console.log(text);
    }
})();
