t.step(
    function() {
        assert_array_equals(targets, 
                            [document.getElementsByTagName('script')[3]]);
    }
); 
t.done();