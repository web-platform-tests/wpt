/**
 * TestCase
 *
 * A generic template for test cases
 * Is intended to be overloaded with subclasses that override testObject, testFunction and argOrder
 * The testObject is the default arguments for the testFunction
 * The default testObject can be modified with the modify() method, making it easy to create new tests based on the default
 * The testFunction is the target of the test and is called by the doIt() method. doIt() applies the testObject as arguments via toArgs()
 * toArgs() uses argOrder to make sure the resulting array is in the right order of the arguments for the testFunction
 */
class TestCase {
    constructor() {
        this.testFunction = function() {
            throw new Error("Test Function not implemented");
        };
        this.testObject = {};
        this.argOrder = [];
        this.ctx = null;
    }

    /**
     * toObject
     *
     * return a copy of the testObject
     */
    toObject() {
        return JSON.parse(JSON.stringify(this.testObject)); // cheap clone
    }

    /**
     * toArgs
     *
     * converts test object to an array that is ordered in the same way as the arguments to the test function
     */
    toArgs() {
        var ret = [];
        // XXX, TODO: this won't necessarily produce the args in the right order
        for (let idx of this.argOrder) {
            ret.push(this.testObject[idx]);
        }
        return ret;
    }

    /**
     * modify
     *
     * update the internal object by a path / value combination
     * e.g. :
     * modify ("foo.bar", 3)
     * accepts three types of args:
     *    "foo.bar", 3
     *    {path: "foo.bar", value: 3}
     *    [{path: "foo.bar", value: 3}, ...]
     */
    modify(arg1, arg2) {
        var mods;

        // check for the two argument scenario
        if (typeof arg1 === "string" && arg2 !== undefined) {
            mods = {
                path: arg1,
                value: arg2
            };
        } else {
            mods = arg1;
        }

        // accept a single modification object instead of an array
        if (!Array.isArray(mods) && typeof mods === "object") {
            mods = [mods];
        }

        // iterate through each of the desired modifications, and call recursiveSetObject on them
        for (let idx in mods) {
            var mod = mods[idx];
            let paths = mod.path.split(".");
            recursiveSetObject(this.testObject, paths, mod.value);
        }

        // iterates through nested `obj` using the `pathArray`, creating the path if it doesn't exist
        // when the final leaf of the path is found, it is assigned the specified value
        function recursiveSetObject(obj, pathArray, value) {
            console.log ("pathArray", pathArray);
            var currPath = pathArray.shift();
            if (typeof obj[currPath] !== "object") {
                obj[currPath] = {};
            }
            if (pathArray.length > 0) {
                return recursiveSetObject(obj[currPath], pathArray, value);
            }
            obj[currPath] = value;
        }

        return this;
    }

    /**
     * test
     *
     * run the test function with the top-level properties of the test object applied as arguments
     */
    doIt() {
        if (typeof this.testFunction !== "function") {
            throw new Error("Test function not found");
        }

        console.log ("doIt args", ...this.toArgs());

        return this.testFunction.call(this.ctx, ...this.toArgs());
    }

    test(desc) {
        promise_test(() => {
            return this.doIt()
                .then((ret) => {
                    console.log ("doIt ret:", ret);
                    // check the result
                    this.validateRet(ret);
                    return ret;
                });
        });
    }

    validateRet() {
        throw new Error("Not implemented");
    }

    /**
     * testArgs
     *
     * calls doIt() with testObject() and expects it to fail with a TypeError()
     */
    testBadArgs(testDesc) {
        promise_test(function(t) {
            return promise_rejects(t, new TypeError(), this.doIt(), "Expected bad parameters to fail");
        }.bind(this), testDesc);
    }
}

/**
 * CreateCredentialTest
 *
 * tests the WebAuthn navigator.credentials.create() interface
 */
class CreateCredentialTest extends TestCase {
    constructor() {
        // initialize the parent class
        super();
        console.log ("CreateCredentialTest constructor:", arguments);

        // the function to be tested
        this.testFunction = navigator.credentials.create;
        // the context to call the test function with (i.e. - the 'this' object for the function)
        this.ctx = navigator.credentials;

        // the default object to pass to makeCredential, to be modified with modify() for various tests
        let challengeBytes = new Uint8Array(16);
        window.crypto.getRandomValues(challengeBytes);
        this.testObject = {
            options: {
                publicKey: {
                    challenge: challengeBytes,
                    // Relying Party:
                    rp: {
                        name: "Acme"
                    },

                    // User:
                    user: {
                        id: "1098237235409872",
                        name: "john.p.smith@example.com",
                        displayName: "John P. Smith",
                        icon: "https://pics.acme.com/00/p/aBjjjpqPb.png"
                    },

                    parameters: [{
                        type: "public-key",
                        algorithm: "ES256",
                    }],

                    timeout: 60000, // 1 minute
                    excludeList: [] // No excludeList
                }
            }
        };

        // how to order the properties of testObject when passing them to makeCredential
        this.argOrder = [
            "options"
        ];

        // enable the constructor to modify the default testObject
        // would prefer to do this in the super class, but have to call super() before using `this.*`
        if (arguments.length) this.modify(...arguments);
    }

    validateRet(ret) {
        // console.log("validateRet:", ret);

        assert_class_string(ret, "PublicKeyCredential", "Expected return to be instance of 'PublicKeyCredential' class");
        assert_idl_attribute(ret, "id", "credentials.create() should return PublicKeyCredential with id attribute");
        assert_readonly(ret, "id", "credentials.create() should return PublicKeyCredential with readonly id attribute");
        assert_idl_attribute(ret, "rawId", "credentials.create() should return PublicKeyCredential with rawId attribute");
        assert_readonly(ret, "rawId", "credentials.create() should return PublicKeyCredential with readonly rawId attribute");
        assert_idl_attribute(ret, "type", "credentials.create() should return PublicKeyCredential with type attribute");
        assert_equals(ret.type, "public-key", "credentials.create() should return PublicKeyCredential with type 'public-key'");

        var response = ret.response;
        assert_class_string(response, "AuthenticatorAttestationResponse", "Expected credentials.create() to return instance of 'AuthenticatorAttestationResponse' class");
        assert_idl_attribute(response, "clientDataJSON", "credentials.create() should return AuthenticatorAttestationResponse with clientDataJSON attribute");
        assert_readonly(response, "clientDataJSON", "credentials.create() should return AuthenticatorAttestationResponse with readonly clientDataJSON attribute");
        assert_idl_attribute(response, "attestationObject", "credentials.create() should return AuthenticatorAttestationResponse with attestationObject attribute");
        assert_readonly(response, "attestationObject", "credentials.create() should return AuthenticatorAttestationResponse with readonly attestationObject attribute");
    }
}


/**
 * GetCredentialsTest
 *
 * tests the WebAuthn navigator.credentials.get() interface
 */
class GetCredentialsTest extends TestCase {
    constructor(...args) {
        // initialize the parent class
        super();

        // the function to be tested
        this.testFunction = navigator.credentials.get;
        // the context to call the test function with (i.e. - the 'this' object for the function)
        this.ctx = navigator.credentials;

        // // the default object to pass to makeCredential, to be modified with modify() for various tests
        // let challengeBytes = new Uint8Array(16);
        // window.crypto.getRandomValues(challengeBytes);
        // this.testObject = {
        //     options: {
        //         publicKey: {
        //             challenge: challengeBytes,
        //             // Relying Party:
        //             rp: {
        //                 name: "Acme"
        //             },

        //             // User:
        //             user: {
        //                 id: "1098237235409872",
        //                 name: "john.p.smith@example.com",
        //                 displayName: "John P. Smith",
        //                 icon: "https://pics.acme.com/00/p/aBjjjpqPb.png"
        //             },

        //             parameters: [{
        //                 type: "public-key",
        //                 algorithm: "ES256",
        //             }],

        //             timeout: 60000, // 1 minute
        //             excludeList: [] // No excludeList
        //         }
        //     }
        // };
        let challengeBytes = new Uint8Array(16);
        window.crypto.getRandomValues(challengeBytes);
        this.testObject = {
            options: {
                publicKey: {
                    challenge: challengeBytes,
                    timeout: 60000,
                    // allowList: [newCredential]
                }
            }
        };

        // how to order the properties of testObject when passing them to makeCredential
        this.argOrder = [
            "options"
        ];

        // enable the constructor to modify the default testObject
        // would prefer to do this in the super class, but have to call super() before using `this.*`
        if (arguments.length) {
            if (args.cred instanceof Promise) this.credPromise = args.cred;
            else if (typeof args.cred === "object") this.credPromise = Promise.resolve (args.cred);
            delete args.cred;
            this.modify(...arguments);
        }
    }

    validateRet(ret) {
        // console.log("validateRet:", ret);

        assert_class_string(ret, "PublicKeyCredential", "Expected return to be instance of 'PublicKeyCredential' class");
        assert_idl_attribute(ret, "id", "credentials.create() should return PublicKeyCredential with id attribute");
        assert_readonly(ret, "id", "credentials.create() should return PublicKeyCredential with readonly id attribute");
        assert_idl_attribute(ret, "rawId", "credentials.create() should return PublicKeyCredential with rawId attribute");
        assert_readonly(ret, "rawId", "credentials.create() should return PublicKeyCredential with readonly rawId attribute");
        assert_idl_attribute(ret, "type", "credentials.create() should return PublicKeyCredential with type attribute");
        assert_equals(ret.type, "public-key", "credentials.create() should return PublicKeyCredential with type 'public-key'")

        var response = ret.response;
        assert_class_string(response, "AuthenticatorAttestationResponse", "Expected credentials.create() to return instance of 'AuthenticatorAttestationResponse' class");
        assert_idl_attribute(response, "clientDataJSON", "credentials.create() should return AuthenticatorAttestationResponse with clientDataJSON attribute");
        assert_readonly(response, "clientDataJSON", "credentials.create() should return AuthenticatorAttestationResponse with readonly clientDataJSON attribute");
        assert_idl_attribute(response, "attestationObject", "credentials.create() should return AuthenticatorAttestationResponse with attestationObject attribute");
        assert_readonly(response, "attestationObject", "credentials.create() should return AuthenticatorAttestationResponse with readonly attestationObject attribute");
    }
}

//************* BEGIN DELETE AFTER 1/1/2018 *************** //
// XXX for development mode only!!
// debug() for debugging purposes... we can drop this later if it is considered ugly
// note that debug is currently an empty function (i.e. - prints no output)
// and debug only prints output if the polyfill is loaded
var debug = function() {};
// if the WebAuthn API doesn't exist load a polyfill for testing
// note that the polyfill only gets loaded if navigator.credentials create doesn't exist
// AND if the polyfill script is found at the right path (i.e. - the polyfill is opt-in)
function ensureInterface() {
    if (typeof navigator.credentials.create !== "function") {
        debug = console.log;

        return loadJavaScript("/webauthn/webauthn-polyfill/webauthn-polyfill.js")
            .then(() => {
                return loadJavaScript("/webauthn/webauthn-soft-authn/soft-authn.js");
            });
    } else {
        return Promise.resolve();
    }
}

function loadJavaScript(path) {
    return new Promise((resolve, reject) => {
        // dynamic loading of polyfill script by creating new <script> tag and seeing the src=
        var scriptElem = document.createElement("script");
        if (typeof scriptElem !== "object") {
            debug("ensureInterface: Error creating script element while attempting loading polyfill");
            return reject(new Error("ensureInterface: Error creating script element while loading polyfill"));
        }
        scriptElem.type = "application/javascript";
        scriptElem.onload = function() {
            debug("!!! Loaded " + path + " ...");
            return resolve();
        };
        scriptElem.onerror = function() {
            return reject(new Error("navigator.credentials.create does not exist"));
        };
        scriptElem.src = path;
        if (document.body) {
            document.body.appendChild(scriptElem);
        } else {
            debug("ensureInterface: DOM has no body");
            return reject(new Error("ensureInterface: DOM has no body"));
        }
    });
}

function standardSetup(cb) {
    return ensureInterface()
        .then(() => {
            if (cb) return cb();
        })
        .catch((err) => {
            debug(err);
            return (err);
        });
}
//************* END DELETE AFTER 1/1/2018 *************** //

/* JSHINT */
/* globals assert_class_string, assert_equals, assert_idl_attribute, assert_readonly, promise_test */
/* exported standardSetup, MakeCredentialTest, GetCredentialsTest */