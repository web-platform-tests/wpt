// console.log("SETTING INSTRUMENTATION");
// J$.analysis = {
  // invokeFunPre: function(iid, f, base, args, isConstructor, isMethod) {
  //   try{

  //     console.log("Function call pre to " + f + " at " + iid, base ,args);
  //   } catch(e) {
  //     console.error("Exception:", e)
  //   }
  // },
//   invokeFun: function(iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) {
//     try{
//       console.log("Function call to " + f.name + " at " + iid, base, result, args );
//     } catch(e) {
//       console.error("Exception:", e)
//     }
//   },
//   wrapMethod: function(obj, method, methodId) {
//     // Only instrument methods of the Window object
//     if (obj === window && typeof method === 'function') {
//       if (methodId === 'fetch') {
//         // Return a new function that wraps the original function
//         return function() {
//           // Log the method call
//           console.log('Method call to Window.fetch');

//           // Call the original function with the original arguments and context
//           return method.apply(this, arguments);
//         };
//       }
//       else if (methodId === 'open') {
//         // Return a new function that wraps the original function
//         return function() {
//           // Log the method call
//           console.log('Method call to Window.open');

//           // Call the original function with the original arguments and context
//           return method.apply(this, arguments);
//         };
//       }
//     }
//   }
// };

J$.analysis = {

 invokeFunPre: function(iid, f, base, args, isConstructor, isMethod) {
    try{
      console.log(`[invokeFunPre] ${f.name}(${args})`);
    } catch(e) {
      console.error("Exception:", e)
    }
  },
  invokeFun: function(iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) {
    try{
      console.log(`[invokeFun] ${f.name}(${args}) = ${result}`);
    } catch(e) {
      console.error("Exception:", e)
    }
  },
  binary: function(iid, op, left, right, result) {
    console.log('[binary]', op, left, right, result);
  },
  conditional: function(iid, result) {
    console.log('[conditional]', result);
  },
  endExpression: function(iid) {
    console.log('[endExpression]', iid);
  },
  functionEnter: function(iid, f, dis, args) {
    console.log('[functionEnter]', f.name, dis, args);
  },
  functionExit: function(iid, returnVal, wrappedExceptionVal) {
    console.log('[functionExit]', returnVal, wrappedExceptionVal);
  },
  putFieldPre: function (iid, base, offset, val, isComputed, isOpAssign){
    console.log('[putFieldPre]', base, offset, val, isComputed, isOpAssign);
  },
  putField: function (iid, base, offset, val, isComputed, isOpAssign) {
    console.log("[putField]", base, offset, val)
    // if (base === window.document && offset === 'cookie') {
    //   console.log('Setting document.cookie:', val);
    // }
  },
  getField: function (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) {
    console.log("[getField]", base, offset, val)
    // if (base === window.document && offset === 'cookie') {
    //   console.log('Getting document.cookie:', val);
    // }
  },
  getProperty: function(iid, base, offset, val, isComputed, isOpAssign, isMethodCall) {
    console.log('[getProperty]', base, offset, val, isComputed, isOpAssign, isMethodCall);
  },
  literal: function(iid, val, hasGetterSetter) {
    console.log('[literal]', val, hasGetterSetter);
  },
  return: function(iid, val) {
    console.log('[return]', val);
  },
  unary: function(iid, op, left, result) {
    console.log('[unary]', op, left, result);
  },
  read: function(iid, name, val, isGlobal, isScriptLocal){
    console.log('[read]', name, val)
  },
  write: function(iid, name, val, lhs, isGlobal, isScriptLocal){
    console.log('[write]', name, lhs, '=', val)
  }
};

