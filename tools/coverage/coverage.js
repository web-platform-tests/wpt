
(function ($) {
    
    function filterByLevel (lvl) {
        var mask;
        if (lvl == 1) mask = ["show", "hide", "hide"];
        else if (lvl == 2) mask = ["show", "show", "hide"];
        else if (lvl == 3) mask = ["show", "show", "show"];
        else alert("Beuargh");
        for (var i = 0, n = mask.length; i < n; i++) {
            var action = mask[i];
            $("td.level" + (i + 1)).parent()[action]();
        }
    }
    $("input[name=level]").click(function () {
        var lvl = $(this).val();
        filterByLevel(lvl);
        localStorage.setItem("filterLevel", lvl);
    });
    var curFilterLevel = localStorage.getItem("filterByLevel") || 3;
    $("input[name=level][value=" + curFilterLevel + "]").attr("checked", "checked");
    filterByLevel(curFilterLevel);
    
    $("#update").click(function () {
        var words = 1 * $("input[name=words]").val()
        ,   rfc2119 = 1 * $("input[name=rfc2119]").val()
        ,   algos = 1 * $("input[name=algos]").val()
        ,   idl = 1 * $("input[name=idl]").val()
        ;

        function ok ($el) { $el.css("background", "#aaff71"); }
        function nok ($el) { $el.css("background", "rgba(255, 0, 0, 0.5)"); }

        function hasEnough (tests, num, el, threshold) {
            if (num === 0) ok(el);
            else {
                var ratio = tests / num;
                (ratio >= threshold) ? ok(el) : nok(el);
            }
        }

        $("table").each(function () {
            $(this).find("tr").each(function () {
                var $tr = $(this);
                if ($tr.find("th").length) return;
                var counts = [];
                $tr.find("td").each(function () {
                    counts.push({ el: $(this), num: 1 * $(this).text() });
                });
                var tests = counts[5].num;
                // words per test
                if (tests === 0) {
                    if (counts[1].num === 0) ok(counts[1].el);
                    else nok(counts[1].el);
                }
                else {
                    var ratio = counts[1].num / tests;
                    (ratio <= words) ? ok(counts[1].el) : nok(counts[1].el);
                }
                // tests per rfc2119
                hasEnough(tests, counts[2].num, counts[2].el, rfc2119);
                hasEnough(tests, counts[3].num, counts[3].el, algos);
                hasEnough(tests, counts[4].num, counts[4].el, idl);
            });
        });

    });
    
    window.cover = function (items, titles, $target) {
        function process () {
            if (!items.length) {
                $("#update").click();
                return;
            }
            var it = items.shift()
            ,   tit = titles.shift()
            ,   $div = $("<div></div>")
            ,   $table = $("<table></table>")
            ,   totals = {
                    algorithmicSteps:       0
                ,   idlComplexity:          0
                ,   normativeStatements:    0
                ,   wordCount:              0
                ,   tests:                  0
                }
            ;
            $("<tr><th>Section</th><th>Words</th><th>2119</th><th>Algos</th><th>IDL</th><th>Tests</th></tr>")
                .appendTo($table);

            $div.append($("<h2></h2>").text(tit));
            $.getJSON("spec-data-" + it + ".json", function (data) {
                for (var i = 0, n = data.length; i < n; i++) {
                    var row = data[i]
                    ,   $tr = $("<tr></tr>")
                    ;
                    $("<td></td>").addClass("level" + row.level).text(row.original_id).appendTo($tr);
                    $("<td></td>").text(row.wordCount).appendTo($tr);
                    $("<td></td>").text(row.normativeStatements).appendTo($tr);
                    $("<td></td>").text(row.algorithmicSteps).appendTo($tr);
                    $("<td></td>").text(row.idlComplexity).appendTo($tr);
                    $("<td></td>").text(row.tests).appendTo($tr);
                    $table.append($tr);
                    if (row.level === 1) {
                        totals.algorithmicSteps += row.algorithmicSteps;
                        totals.idlComplexity += row.idlComplexity;
                        totals.normativeStatements += row.normativeStatements;
                        totals.wordCount += row.wordCount;
                        totals.tests += row.tests;
                    }
                }
                $div.append($table);
                var $ul = $("<ul></ul>");
                $("<li></li>").text("Words: " + totals.wordCount).appendTo($ul);
                $("<li></li>").text("2119: " + totals.normativeStatements).appendTo($ul);
                $("<li></li>").text("Algos: " + totals.algorithmicSteps).appendTo($ul);
                $("<li></li>").text("IDL: " + totals.idlComplexity).appendTo($ul);
                $("<li></li>").text("Tests: " + totals.tests).appendTo($ul);
                $div.append($ul);
                $target.append($div);
                process();
            });
        }
        process();
    };
}(jQuery));

