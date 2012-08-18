add_start_callback(initTransform);
add_result_callback(initTransform);

test( testAnimValUpdatedAfterModification, "patternTransformAnimValUpdatedAfterModification", {assert: 'animVal list is updated when baseVal is cleared'} );  
test( testListItemUpdated, "patternTransformListItemUpdated", {assert: 'List is updated immediately when modifications are made to list items'} );  
test( testInitializeRemovesItem, "patternTransformInitializeRemovesItem", {assert: 'If the item used to initialize a list is previously on a list, it is removed its previous list'} );  
test( testInsertItemBeforeRemovesItem, "patternTransformInsertItemBeforeRemovesItem", {assert: 'If the item being inserted is previously on a list, it is removed its previous list'} );  
test( testInsertItemBeforeAlreadyOnList, "patternTransformInsertItemBeforeAlreadyOnList", {assert: 'If the item being inserted is already on that list, it is removed from the list before being inserted'} );  
test( testReplaceItemRemovesItem, "patternTransformReplaceItemRemovesItem", {assert: 'If the replacement item being inserted is previously on a list, it is removed its previous list'} );  
test( testReplaceItemAlreadyOnList, "patternTransformReplaceItemAlreadyOnList", {assert: 'If the replacement item being inserted is already on that list, it is removed from the list before the replacement'} );  
test( testAppendItemRemovesItem, "patternTransformAppendItemRemovesItem", {assert: 'If the item being appended is previously on a list, it is removed its previous list before being appended'} );  
test( testAppendItemAlreadyOnList, "patternTransformAppendItemAlreadyOnList", {assert: 'If the item being appended is already on that list, it is removed from the list before being appended'} );  
test( testCreateTransformFromMatrix, "patternTransformCreateTransformFromMatrix", {assert: 'Matrix is created with transform type = SVG_TRANSFORM_MATRIX and the values from matrix parameter are copied'} );  
test( testConsolidateAllTypes, "patternTransformConsolidateAllTypes", {assert: 'All types of transforms can be consolidated into a single matrix'} );  
test( testModifyConsolidated, "patternTransformModifyConsolidated", {assert: 'Modifications can be made to a consolidated matrix'} );  
test( testConsolidateConsolidated, "patternTransformConsolidateConsolidated", {assert: 'Consolidated matrix can be consolidated again'} );  
test( testSetMatrix, "patternTransformSetMatrix", {assert: 'setMatrix() modifications update the list correctly'} );  
test( testSetTranslate, "patternTransformSetTranslate", {assert: 'setTranslate() modifications update the list correctly'} );  
test( testSetRotate, "patternTransformSetRotate", {assert: 'setRotate() modifications update the list correctly'} );  
test( testSetScale, "patternTransformSetScale", {assert: 'setScale() modifications update the list correctly'} );  
test( testSetSkewX, "patternTransformSetSkewX", {assert: 'setSkewX() modifications update the list correctly'} );  
test( testSetSkewY, "patternTransformSetSkewY", {assert: 'setSkewY() modifications update the list correctly'} );



function initTransform() {
	
	tList = document.getElementById("greenRects").patternTransform;
	
	tList.baseVal.clear();
	tList.baseVal.initialize( document.getElementById("svg").createSVGTransform() );
	tList.baseVal.appendItem( document.getElementById("svg").createSVGTransform() );
	tList.baseVal.appendItem( document.getElementById("svg").createSVGTransform() );
}

