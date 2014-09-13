
describe "Clipboard events testsuite" do
  before(:all) do
    @browser = OperaWatir::Browser.new
    $base = 'file://localhost/d:/projects/spec-dev/copy-paste/W3C-repo/clipops/testsuite/'
  end

	it "1 ClipboardEvent - events fire on INPUT " do
		doSingleTest 1
	end

	it "5 ClipboardEvent - events fire on TEXTAREA " do
		doSingleTest 5
	end

	it "9 setData() method " do
		doSingleTest 9
	end

	it "11 copy event when there is no selection and script uses setData()  " do
		doSingleTest 11
	end

	it "13 cancelling default action, basic test  " do
		doSingleTest 13
	end

	it "17 copy event does not modify selection  " do
		doSingleTest 17
	end

	it "19 default action of event when there is no selection is noop " do
		doSingleTest 19
	end

	it "21 default action of cut event when there is no selection - no text change " do
		doSingleTest 21
	end

	it "22 getData() method in cut and copy events should return an empty string " do
		doSingleTest 22
	end

	it "24 getData() method when type is unsupported should return an empty string " do
		doSingleTest 24
	end

	it "25 cancelling default action of cut prevents removal of text from editable context  " do
		doSingleTest 25
	end

	it "27 no default action for cut in non-editable context " do
		doSingleTest 27
	end

	it "28 setData() in cut event without preventDefault() has no effect when default action is noop " do
		doSingleTest 28
	end

	it "29 cut fires before text is removed  " do
		doSingleTest 29
	end

	it "31 cut collapses selection  " do
		doSingleTest 31
	end

	it "32 modifying data for cut event in non-editable context with selection " do
		doSingleTest 32
	end

	it "34 setData() method without preventing events's default action " do
		doSingleTest 34
	end

	it "36 events fire on INPUT " do
		doSingleTest 36
	end

	it "38 events fire on TEXTAREA " do
		doSingleTest 38
	end

	it "40 paste event fires before data is inserted " do
		doSingleTest 40
	end

	it "42 preventing default action  " do
		doSingleTest 42
	end

	it "44 paste event fires even in non-editable context " do
		doSingleTest 44
	end

	it "45 setData() does not modify text that is about to be inserted in a paste event " do
		doSingleTest 45
	end

	it "46 setData() doesn't modify text on the clipboard when called from a paste event " do
		doSingleTest 46
	end

	it "47 getData() method in paste event retrieving plain text " do
		doSingleTest 47
	end

	it "48 getData() method when called outside event handler should return an empty string " do
		doSingleTest 48
	end

	it "49 getData() method with wrong number of arguments " do
		doSingleTest 49
	end

	it "50 getData() method supports legacy 'text' argument " do
		doSingleTest 50
	end

	it "51 getData() supports legacy 'url' argument " do
		doSingleTest 51
	end

	it "52 getData() method's type argument not case sensitive " do
		doSingleTest 52
	end

	it "53 Using beforecopy to enable 'copy' UI that would otherwise be disabled " do
		doSingleTest 53
	end

	it "54 Using beforecut to enable 'cut' UI that would otherwise be disabled " do
		doSingleTest 54
	end

	it "55 Using beforepaste to enable 'paste' UI that would otherwise be disabled " do
		doSingleTest 55
	end

	it "56 event.clipboardData exists and inherits from DataTransfer " do
		doSingleTest 56
	end

	it "59 Clipboard event's clipboardData API " do
		doSingleTest 59
	end

	it "62 event target when selection spans several elements  " do
		doSingleTest 62
	end

	it "68 event target when selection spans several elements  " do
		doSingleTest 68
	end

	it "71 event target when selection spans several elements - reversed selection  " do
		doSingleTest 71
	end

	it "77 event target when selection spans several elements - reversed selection  " do
		doSingleTest 77
	end

	it "80 event target when focused element has no text node inside  " do
		doSingleTest 80
	end

	it "82 copy event target property - selection in input  " do
		doSingleTest 82
	end

	it "85 event target property - selection in document text  " do
		doSingleTest 85
	end

	it "88 event target when no specific element has focus  " do
		doSingleTest 88
	end

	it "91 clipboardData.items when clipboard has one single text/plain entry " do
		doSingleTest 91
	end

	it "92 getting data from clipboardData.items when clipboard has one single text/plain entry " do
		doSingleTest 92
	end

	it "93 setData and clipboardData.items  " do
		doSingleTest 93
	end

	it "95 pasting a file " do
		doSingleTest 95
	end

	it "96 pasting a file of unknown type " do
		doSingleTest 96
	end

	it "97 setData() followed by clearData() in same event handler " do
		doSingleTest 97
	end

	it "99 clearData() followed by setData() in same event handler " do
		doSingleTest 99
	end

	it "101 clipboard modification when script uses both clearData() and setData()  " do
		doSingleTest 101
	end

	it "103 reading clipboard data from looping script  " do
		doSingleTest 103
	end

	it "104 clearData() method without arguments " do
		doSingleTest 104
	end

	it "106 clearData() method with text/html argument " do
		doSingleTest 106
	end

	it "108 ClipboardEvent interface - synthetic events with new ClipboardEvent constructor  " do
		doSingleTest 108
	end

	it "109 ClipboardEvent interface - synthetic events with non-standard MIME type  " do
		doSingleTest 109
	end

	it "110 ClipboardEvent interface - synthetic copy/cut events must not affect system clipboard " do
		doSingleTest 110
	end

	it "112 ClipboardEvent interface - synthetic copy/cut events dispatched from trusted events do affect system clipboard " do
		doSingleTest 112
	end

	it "114 ClipboardEvent interface - synthetic paste event inserts payload data into TEXTAREA  " do
		doSingleTest 114
	end

	it "115 ClipboardEvent interface - synthetic paste event inserts payload data into INPUT  " do
		doSingleTest 115
	end

	it "116 ClipboardEvent interface - synthetic paste event does not insert text/html payload data into INPUT  " do
		doSingleTest 116
	end

	it "117 ClipboardEvent interface - synthetic paste event inserts plain text data into contentEditable element  " do
		doSingleTest 117
	end

	it "118 ClipboardEvent interface - synthetic paste event inserts HTML data into contentEditable element  " do
		doSingleTest 118
	end

	it "119 integration with execCommand, events are syncronous " do
		doSingleTest 119
	end

	it "122 integration with execCommand, can prevent default action " do
		doSingleTest 122
	end

	it "124 integration with execCommand, can prevent default action " do
		doSingleTest 124
	end

	it "125 clipboard events relative to key events  " do
		doSingleTest 125
	end

	it "128 clipboard events relative to key events - preventDefault prevents clipboard events  " do
		doSingleTest 128
	end

	it "131 clipboard events relative to other input events  " do
		doSingleTest 131
	end

	it "132 clipboard events relative to other input events  " do
		doSingleTest 132
	end

	it "133 copy operation does not dispatch other events  " do
		doSingleTest 133
	end

	it "135 event listener that modifies focus " do
		doSingleTest 135
	end

	it "137 event listener that modifies focus " do
		doSingleTest 137
	end

	it "138 event listener that modifies selection " do
		doSingleTest 138
	end

	it "139 setData() called outside event handler method " do
		doSingleTest 139
	end

	it "142 items.add() called outside event handler method " do
		doSingleTest 142
	end

	it "145 clearData() called outside event handler method " do
		doSingleTest 145
	end

	it "148 ClipboardEvent and non-ASCII data I - Japanese " do
		doSingleTest 148
	end

	it "150 ClipboardEvent and non-ASCII data I - Japanese " do
		doSingleTest 150
	end

	it "151 ClipboardEvent and non-ASCII data II - random Unicode symbols " do
		doSingleTest 151
	end

	it "153 events fire inside SVG content  " do
		doSingleTest 153
	end

	it "159 events fire inside editable SVG content  " do
		doSingleTest 159
	end

	it "165 events fire inside SVG content in contentEditable " do
		doSingleTest 165
	end

	it "171 types property - all implementations must return 'text/plain' as one of the .types entries when there is plain text on the clipboard " do
		doSingleTest 171
	end

	it "172 setData() method does not throw when implementation does not know the type " do
		doSingleTest 172
	end

	it "174 setData() method with text/html (experimental) " do
		doSingleTest 174
	end

	it "176 clearData() method is noop in paste event " do
		doSingleTest 176
	end

	it "177 clearData() method without preventing events's default action " do
		doSingleTest 177
	end

end
