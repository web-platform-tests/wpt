add_start_callback(initTransform);
add_result_callback(initTransform);

test( testAnimValUpdatedAfterModification, "gradientTransformAnimValUpdatedAfterModification", {assert: 'animVal list is updated when baseVal is cleared'} );  
test( testListItemUpdated, "gradientTransformListItemUpdated", {assert: 'List is updated immediately when modifications are made to list items'} );  
test( testInitializeRemovesItem, "gradientTransformInitializeRemovesItem", {assert: 'If the item used to initialize a list is previously on a list, it is removed its previous list'} );  
test( testInsertItemBeforeRemovesItem, "gradientTransformInsertItemBeforeRemovesItem", {assert: 'If the item being inserted is previously on a list, it is removed its previous list'} );  
test( testInsertItemBeforeAlreadyOnList, "gradientTransformInsertItemBeforeAlreadyOnList", {assert: 'If the item being inserted is already on that list, it is removed from the list before being inserted'} );  
test( testReplaceItemRemovesItem, "gradientTransformReplaceItemRemovesItem", {assert: 'If the replacement item being inserted is previously on a list, it is removed its previous list'} );  
test( testReplaceItemAlreadyOnList, "gradientTransformReplaceItemAlreadyOnList", {assert: 'If the replacement item being inserted is already on that list, it is removed from the list before the replacement'} );  
test( testAppendItemRemovesItem, "gradientTransformAppendItemRemovesItem", {assert: 'If the item being appended is previously on a list, it is removed its previous list before being appended'} );  
test( testAppendItemAlreadyOnList, "gradientTransformAppendItemAlreadyOnList", {assert: 'If the item being appended is already on that list, it is removed from the list before being appended'} );  
test( testCreateTransformFromMatrix, "gradientTransformCreateTransformFromMatrix", {assert: 'Matrix is created with transform type = SVG_TRANSFORM_MATRIX and the values from matrix parameter are copied'} );  
test( testConsolidateAllTypes, "gradientTransformConsolidateAllTypes", {assert: 'All types of transforms can be consolidated into a single matrix'} );  
test( testModifyConsolidated, "gradientTransformModifyConsolidated", {assert: 'Modifications can be made to a consolidated matrix'} );  
test( testConsolidateConsolidated, "gradientTransformConsolidateConsolidated", {assert: 'Consolidated matrix can be consolidated again'} );  
test( testSetMatrix, "gradientTransformSetMatrix", {assert: 'setMatrix() modifications update the list correctly'} );  
test( testSetTranslate, "gradientTransformSetTranslate", {assert: 'setTranslate() modifications update the list correctly'} );  
test( testSetRotate, "gradientTransformSetRotate", {assert: 'setRotate() modifications update the list correctly'} );  
test( testSetScale, "gradientTransformSetScale", {assert: 'setScale() modifications update the list correctly'} );  
test( testSetSkewX, "gradientTransformSetSkewX", {assert: 'setSkewX() modifications update the list correctly'} );  
test( testSetSkewY, "gradientTransformSetSkewY", {assert: 'setSkewY() modifications update the list correctly'} );  


function initTransform() {
	
	tList = document.getElementById("grad").gradientTransform;
	
	tList.baseVal.clear();
	tList.baseVal.initialize( document.getElementById("svg").createSVGTransform() );
	tList.baseVal.appendItem( document.getElementById("svg").createSVGTransform() );
	tList.baseVal.appendItem( document.getElementById("svg").createSVGTransform() );
}

