(function () {
    function OrientationTester(container, orientation) {
        this.container = container;
        this.setOrientation(orientation);
    }
    extend(OrientationTester.prototype, {
        setOrientation: function (orientation) {
            this.orientation = orientation;
            if (orientation == "R") {
                this.advanceExpected = 8;
                this.advanceFailed = 4;
            } else {
                this.advanceExpected = 4;
                this.advanceFailed = 8;
            }
        },
        measure: function () {
            var nodes = this.container.childNodes;
            for (var i = 0; i < nodes.length; i++)
                this._measureNode(nodes[i]);
        },
        _measureNode: function (node) {
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
        }});

    function Results(name) {
        appendChildElement(details, "h3", name);
        this.list = appendChildElement(details, "ol");
        this.failCount = 0;
        this.inconclusiveCount = 0;
    }
    extend(Results.prototype, {
        failed: function (test, code) {
            this.failCount++;
            this.append(test, code);
        },
        inconclusive: function (test, code, rect) {
            this.inconclusiveCount++;
            this.append(test, code, " but inconclusive (rendered as " + rect.width + "x" + rect.height + ")");
        },
        append: function (test, code, message) {
            var text = stringFromUnicode(code) + " should be " + test.orientation;
            if (message)
                text += message;
            appendChildElement(this.list, "li", text);
        }});

    function Runner() {
        this.tester = new OrientationTester(container, vo);
        this.test = async_test("Default orientation for vo=" + vo);
        this.testU = async_test("Orientation=Upright");
        this.testR = async_test("Orientation=Rotated");
    }
    extend(Runner.prototype, {
        run: function () {
            log("Started");
            var start = new Date

            this.runCore(this.test);
            this.runOrientation(this.testU, "U");
            this.runOrientation(this.testR, "R");

            log("Elapsed " + (new Date() - start));
            done();
        },
        runOrientation: function (test, orientation) {
            container.classList.add(orientation);
            this.tester.setOrientation(orientation);
            this.runCore(test);
            container.classList.remove(orientation);
        },
        runCore: function (test) {
            var tester = this.tester;
            var me = this;
            test.step(function () {
                var results = new Results(test.name);
                tester.results = results;
                tester.measure();
                me.done(test, results);
            });
        },
        done: function (test, results) {
            if (results.inconclusiveCount)
                test.name += " (" + results.inconclusiveCount + " inconclusive)";
            assert_equals(results.failCount, 0, "Fail count");
            test.done();
        }});

    setup({explicit_done:true, explicit_timeout:true});
    var runner = new Runner();
    window.onload = function () {
        log("onload");
        if (document.fonts) {
            document.fonts.load("16px orientation")
                .then(function () { runner.run(); });
        } else {
            document.offsetTop;
            runner.run();
        }
    }

    function stringFromUnicode(code) {
        var hex = "0000" + code.toString(16).toUpperCase();
        hex = hex.substr(hex.length - 4);
        return hex + ' "' + String.fromCharCode(code) + '"';
    }

    function appendChildElement(parent, tag, text) {
        var node = document.createElement(tag);
        if (text)
            node.textContent = text;
        parent.appendChild(node);
        return node;
    }

    function extend(target, dict) {
        for (var key in dict)
            target[key] = dict[key];
    }

    function log(text) {
        console.log(text);
    }
})();
