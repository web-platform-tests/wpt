
describe "Clipboard events testsuite" do
  before(:all) do
    @browser = OperaWatir::Browser.new
    $base = '/web-platform-tests/clipboard-apis/testsuite/'
  end

	it "1 Using beforecopy to enable 'copy' UI that would otherwise be disabled " do
		doSingleTest 1
	end

	it "2 Using beforecut to enable 'cut' UI that would otherwise be disabled " do
		doSingleTest 2
	end

	it "3 Using beforepaste to enable 'paste' UI that would otherwise be disabled " do
		doSingleTest 3
	end

	it "4 ClipboardEvent - events fire on INPUT " do
		doSingleTest 4
	end

	it "8 ClipboardEvent - events fire on TEXTAREA " do
		doSingleTest 8
	end

	it "12 setData() method " do
		doSingleTest 12
	end

	it "14 copy event when there is no selection and script uses setData()  " do
		doSingleTest 14
	end

	it "16 cancelling default action, basic test  " do
		doSingleTest 16
	end

	it "20 copy event does not modify selection  " do
		doSingleTest 20
	end

	it "22 default action of event when there is no selection is noop " do
		doSingleTest 22
	end

	it "24 default action of cut event when there is no selection - no text change " do
		doSingleTest 24
	end

	it "25 getData() method in cut and copy events should return an empty string " do
		doSingleTest 25
	end

	it "27 getData() method when type is unsupported should return an empty string " do
		doSingleTest 27
	end

	it "28 cancelling default action of cut prevents removal of text from editable context  " do
		doSingleTest 28
	end

	it "30 cut fires before text is removed  " do
		doSingleTest 30
	end

	it "32 cut collapses selection  " do
		doSingleTest 32
	end

	it "33 no default action for cut in non-editable context " do
		doSingleTest 33
	end

	it "34 setData() in cut event without preventDefault() has no effect when default action is noop " do
		doSingleTest 34
	end

	it "35 modifying data for cut event in non-editable context with selection " do
		doSingleTest 35
	end

	it "37 setData() method without preventing events's default action " do
		doSingleTest 37
	end

	it "39 events fire on INPUT " do
		doSingleTest 39
	end

	it "41 events fire on TEXTAREA " do
		doSingleTest 41
	end

	it "43 paste event fires before data is inserted " do
		doSingleTest 43
	end

	it "45 preventing default action  " do
		doSingleTest 45
	end

	it "47 paste event fires even in non-editable context " do
		doSingleTest 47
	end

	it "48 setData() does not modify text that is about to be inserted in a paste event " do
		doSingleTest 48
	end

	it "49 setData() doesn't modify text on the clipboard when called from a paste event " do
		doSingleTest 49
	end

	it "50 getData() method in paste event retrieving plain text " do
		doSingleTest 50
	end

	it "51 getData() method when called outside event handler should return an empty string " do
		doSingleTest 51
	end

	it "52 getData() method with wrong number of arguments " do
		doSingleTest 52
	end

	it "53 getData() method supports legacy 'text' argument " do
		doSingleTest 53
	end

	it "54 getData() supports legacy 'url' argument " do
		doSingleTest 54
	end

	it "55 getData() method's type argument not case sensitive " do
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

	it "97 clearData() method without arguments " do
		doSingleTest 97
	end

	it "99 clearData() method with text/html argument " do
		doSingleTest 99
	end

	it "101 setData() followed by clearData() in same event handler " do
		doSingleTest 101
	end

	it "103 clearData() followed by setData() in same event handler " do
		doSingleTest 103
	end

	it "105 clipboard modification when script uses both clearData() and setData()  " do
		doSingleTest 105
	end

	it "107 reading clipboard data from looping script  " do
		doSingleTest 107
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

	it "112 ClipboardEvent interface - execCommand() inside trusted event affects clipboard " do
		doSingleTest 112
	end

	it "114 ClipboardEvent interface - synthetic paste event does not insert payload data into TEXTAREA  " do
		doSingleTest 114
	end

	it "115 ClipboardEvent interface - synthetic paste event does not insert payload data into INPUT  " do
		doSingleTest 115
	end

	it "116 ClipboardEvent interface - synthetic paste event does not insert text/html payload data into INPUT  " do
		doSingleTest 116
	end

	it "117 ClipboardEvent interface - synthetic paste event does not insert plain text data into contentEditable element  " do
		doSingleTest 117
	end

	it "118 ClipboardEvent interface - synthetic paste event does not insert HTML data into contentEditable element  " do
		doSingleTest 118
	end

	it "119 integration with execCommand - returns false when not allowed to write to clipboard " do
		doSingleTest 119
	end

	it "121 integration with execCommand, events are syncronous " do
		doSingleTest 121
	end

	it "124 integration with execCommand, can prevent default action " do
		doSingleTest 124
	end

	it "126 integration with execCommand, can prevent default action " do
		doSingleTest 126
	end

	it "127 clipboard events relative to key events  " do
		doSingleTest 127
	end

	it "130 clipboard events relative to key events - preventDefault prevents clipboard events  " do
		doSingleTest 130
	end

	it "133 clipboard events relative to other input events  " do
		doSingleTest 133
	end

	it "134 clipboard events relative to other input events  " do
		doSingleTest 134
	end

	it "135 copy operation does not dispatch other events  " do
		doSingleTest 135
	end

	it "137 event listener that modifies focus " do
		doSingleTest 137
	end

	it "139 event listener that modifies focus " do
		doSingleTest 139
	end

	it "140 event listener that modifies selection " do
		doSingleTest 140
	end

	it "141 setData() called outside event handler method " do
		doSingleTest 141
	end

	it "144 items.add() called outside event handler method " do
		doSingleTest 144
	end

	it "147 clearData() called outside event handler method " do
		doSingleTest 147
	end

	it "150 ClipboardEvent and non-ASCII data I - Japanese " do
		doSingleTest 150
	end

	it "152 ClipboardEvent and non-ASCII data I - Japanese " do
		doSingleTest 152
	end

	it "153 ClipboardEvent and non-ASCII data II - random Unicode symbols " do
		doSingleTest 153
	end

	it "155 events fire inside SVG content  " do
		doSingleTest 155
	end

	it "161 events fire inside editable SVG content  " do
		doSingleTest 161
	end

	it "167 events fire inside SVG content in contentEditable " do
		doSingleTest 167
	end

	it "173 types property - 'text/plain' in .types entries when there is plain text on the clipboard " do
		doSingleTest 173
	end

	it "174 setData() method does not throw when implementation does not know the type " do
		doSingleTest 174
	end

	it "176 setData() method with text/html (experimental) " do
		doSingleTest 176
	end

	it "178 clearData() method is noop in paste event " do
		doSingleTest 178
	end

	it "179 clearData() method without preventing events's default action " do
		doSingleTest 179
	end

end
