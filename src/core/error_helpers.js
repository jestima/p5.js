/**
 * @for p5
 * @requires core
 *
 * This is the main file for the Friendly Error System (FES). Here is a
 * brief outline of the functions called in this system.
 *
 * The FES may be invoked by a call to either (1) _validateParameters,
 * (2) _friendlyFileLoadError, (3) _friendlyError, or (4) helpForMisusedAtTopLevelCode.
 *
 * helpForMisusedAtTopLevelCode is called by this file on window load to check for use
 * of p5.js functions outside of setup() or draw()
 * Items 1-3 above are called by functions in the p5 library located in other files.
 *
 * _friendlyFileLoadError is called by the loadX() methods.
 * _friendlyError can be called by any function to offer a helpful error message.
 *
 * _validateParameters is called by functions in the p5.js API to help users ensure
 * ther are calling p5 function with the right parameter types. The property
 * disableFriendlyErrors = false can be set from a p5.js sketch to turn off parameter
 * checking. The call sequence from _validateParameters looks something like this:
 *
 * _validateParameters
 *   lookupParamDoc
 *   scoreOverload
 *     testParamTypes
 *     testParamType
 *   getOverloadErrors
 *   _friendlyParamError
 *     ValidationError
 *     report
 *       friendlyWelcome
 *
 * The call sequences to _friendlyFileLoadError and _friendlyError are like this:
 * _friendlyFileLoadError
 *   report
 *
 * _friendlyError
 *   report
 *
 * report() is the main function that prints directly to console with the output
 * of the error helper message. Note: friendlyWelcome() also prints to console directly.
 */
import p5 from './main';
import * as constants from './constants';
import { translator } from './internationalization';

// p5.js blue, p5.js orange, auto dark green; fallback p5.js darkened magenta
// See testColors below for all the color codes and names
const typeColors = ['#2D7BB6', '#EE9900', '#4DB200', '#C83C00'];

if (typeof IS_MINIFIED !== 'undefined') {
  p5._validateParameters = p5._friendlyFileLoadError = p5._friendlyError = p5._clearValidateParamsCache = () => {};
} else {
  let doFriendlyWelcome = false; // TEMP until we get it all working LM
  // for parameter validation
  const dataDoc = require('../../docs/parameterData.json');
  const arrDoc = JSON.parse(JSON.stringify(dataDoc));

  // -- Borrowed from jQuery 1.11.3 --
  const class2type = {};
  const toString = class2type.toString;
  const names = [
    'Boolean',
    'Number',
    'String',
    'Function',
    'Array',
    'Date',
    'RegExp',
    'Object',
    'Error'
  ];
  for (let n = 0; n < names.length; n++) {
    class2type[`[object ${names[n]}]`] = names[n].toLowerCase();
  }
  const getType = obj => {
    if (obj == null) {
      return `${obj}`;
    }
    return typeof obj === 'object' || typeof obj === 'function'
      ? class2type[toString.call(obj)] || 'object'
      : typeof obj;
  };

  // -- End borrow --

  const friendlyWelcome = () => {
    // p5.js brand - magenta: #ED225D
    //const astrixBgColor = 'transparent';
    //const astrixTxtColor = '#ED225D';
    //const welcomeBgColor = '#ED225D';
    //const welcomeTextColor = 'white';
    const welcomeMessage = translator('fes.pre', {
      message: translator('fes.welcome')
    });
    console.log(
      '    _ \n' +
        ' /\\| |/\\ \n' +
        " \\ ` ' /  \n" +
        ' / , . \\  \n' +
        ' \\/|_|\\/ ' +
        '\n\n' +
        welcomeMessage
    );
  };

  /**
   * Prints out a fancy, colorful message to the console log
   *
   * @method report
   * @private
   * @param  {String}               message the words to be said
   * @param  {String}               func    the name of the function to link
   * @param  {Number|String} color   CSS color string or error type
   *
   * @return console logs
   */
  const report = (message, func, color) => {
    if (doFriendlyWelcome) {
      friendlyWelcome();
      doFriendlyWelcome = false;
    }
    if ('undefined' === getType(color)) {
      color = '#B40033'; // dark magenta
    } else if (getType(color) === 'number') {
      // Type to color
      color = typeColors[color];
    }
    if (func.substring(0, 4) === 'load') {
      console.log(translator('fes.pre', { message }));
    } else {
      console.log(
        translator('fes.pre', {
          message: `${message} (http://p5js.org/reference/#p5/${func})`
        })
      );
    }
  };

  // mapping used by `_friendlyFileLoadError`
  const fileLoadErrorCases = (num, filePath) => {
    const suggestion = translator('fes.fileLoadError.suggestion', {
      filePath,
      link: 'https://github.com/processing/p5.js/wiki/Local-server'
    });
    switch (num) {
      case 0:
        return {
          message: translator('fes.fileLoadError.image', {
            suggestion
          }),
          method: 'loadImage'
        };
      case 1:
        return {
          message: translator('fes.fileLoadError.xml', {
            suggestion
          }),
          method: 'loadXML'
        };
      case 2:
        return {
          message: translator('fes.fileLoadError.table', {
            suggestion
          }),
          method: 'loadTable'
        };
      case 3:
        return {
          message: translator('fes.fileLoadError.strings', {
            suggestion
          }),
          method: 'loadStrings'
        };
      case 4:
        return {
          message: translator('fes.fileLoadError.font', {
            suggestion
          }),
          method: 'loadFont'
        };
      case 5:
        return {
          message: translator('fes.fileLoadError.json', {
            suggestion
          }),
          method: 'loadJSON'
        };
      case 6:
        return {
          message: translator('fes.fileLoadError.bytes', {
            suggestion
          }),
          method: 'loadBytes'
        };
      case 7:
        return {
          message: translator('fes.fileLoadError.large'),
          method: 'loadX'
        };
      case 8:
        return {
          message: translator('fes.fileLoadError.gif'),
          method: 'loadImage'
        };
    }
  };

  /**
   * This is called internally if there is a error during file loading.
   *
   * @method _friendlyFileLoadError
   * @private
   * @param  {Number} errorType
   * @param  {String} filePath
   */
  p5._friendlyFileLoadError = function(errorType, filePath) {
    const { message, method } = fileLoadErrorCases(errorType, filePath);
    report(message, method, 3);
  };

  /**
   * This is a generic method that can be called from anywhere in the p5
   * library to alert users to a common error.
   *
   * @method _friendlyError
   * @private
   * @param  {Number} message message to be printed
   * @param  {String} method name of method
   */
  p5._friendlyError = function(message, method) {
    report(message, method);
  };

  /**
   * This is called internally if there is a error with autoplay.
   *
   * @method _friendlyAutoplayError
   * @private
   */
  p5._friendlyAutoplayError = function(src) {
    const message = translator('fes.autoplay', {
      src,
      link: 'https://developer.mozilla.org/docs/Web/Media/Autoplay_guide'
    });
    console.log(translator('fes.pre', { message }));
  };

  const docCache = {};
  const builtinTypes = new Set([
    'null',
    'number',
    'string',
    'boolean',
    'constant',
    'function',
    'any',
    'integer'
  ]);

  const basicTypes = {
    number: true,
    boolean: true,
    string: true,
    function: true,
    undefined: true
  };

  // reverse map of all constants
  const constantsReverseMap = {};
  for (let key in constants) {
    constantsReverseMap[constants[key]] = key;
  }

  // mapping names of p5 types to their constructor function
  // p5Constructors:
  //    - Color: f()
  //    - Graphics: f()
  //    - Vector: f()
  // and so on
  const p5Constructors = {};

  // For speedup over many runs. funcSpecificConstructors[func] only has the
  // constructors for types which were seen earlier as args of "func"
  const funcSpecificConstructors = {};
  window.addEventListener('load', () => {
    // Make a list of all p5 classes to be used for argument validation
    // This must be done only when everything has loaded otherwise we get
    // an empty array
    for (let key of Object.keys(p5)) {
      // Get a list of all constructors in p5. They are functions whose names
      // start with a capital letter
      if (typeof p5[key] === 'function' && key[0] !== key[0].toLowerCase()) {
        p5Constructors[key] = p5[key];
      }
    }
  });

  const argumentTree = {};
  // The following two functions are responsible for querying and inserting
  // into the argument tree. It stores the types of arguments that each
  // function has seen so far. It is used to query if a sequence of
  // arguments seen in validate parameters was seen before.
  // Lets consider that the following segment of code runs repeatedly, perhaps
  // in a loop or in draw()
  //   color(10, 10, 10);
  //   color(10, 10);
  //   color('r', 'g', 'b');
  // After the first of run the code segment, the argument tree looks like
  // - color
  //     - number
  //        - number
  //            - number
  //                - seen: true
  //            - seen: true
  //     - string
  //        - string
  //            - string
  //                - seen: true
  // seen: true signifies that this argument was also seen as the last
  // argument in a call. Now in the second run of the sketch, it would traverse
  // the existing tree and see seen: true, i.e this sequence was seen
  // before and so scoring can be skipped. This also prevents logging multiple
  // validation messages for the same thing.

  // These two functions would be called repeatedly over and over again,
  // so they need to be as optimized for performance as possible

  const addType = (value, obj, func) => {
    let type = typeof value;
    if (basicTypes[type]) {
      if (constantsReverseMap[value]) {
        // check if the value is a p5 constant and if it is, we would want the
        // value itself to be stored in the tree instead of the type
        obj = obj[value] || (obj[value] = {});
      } else {
        obj = obj[type] || (obj[type] = {});
      }
    } else if (value === null) {
      // typeof null -> "object". don't want that
      obj = obj['null'] || (obj['null'] = {});
    } else {
      // objects which are instances of p5 classes have nameless constructors.
      // native objects have a constructor named "Object". This check
      // differentiates between the two so that we dont waste time finding the
      // p5 class if we just have a native object
      if (value.constructor && value.constructor.name) {
        obj = obj[value.constructor.name] || (obj[value.constructor.name] = {});
        return obj;
      }

      // constructors for types defined in p5 do not have a name property.
      // e.constructor.name gives "". Code in this segment is a workaround for it

      // p5C will only have the name: constructor mapping for types
      // which were already seen as args of "func"
      let p5C = funcSpecificConstructors[func];
      // p5C would contain much fewer items than p5Constructors. if we find our
      // answer in p5C, we don't have to scan through p5Constructors

      if (p5C === undefined) {
        // if there isn't an entry yet for func
        // make an entry of empty object
        p5C = funcSpecificConstructors[func] = {};
      }

      for (let key in p5C) {
        // search on the constructors we have already seen (smaller search space)
        if (value instanceof p5C[key]) {
          obj = obj[key] || (obj[key] = {});
          return obj;
        }
      }

      for (let key in p5Constructors) {
        // if the above search didn't work, search on all p5 constructors
        if (value instanceof p5Constructors[key]) {
          obj = obj[key] || (obj[key] = {});
          // if found, add to known constructors for this function
          p5C[key] = p5Constructors[key];
          return obj;
        }
      }
      // nothing worked, put the type as is
      obj = obj[type] || (obj[type] = {});
    }

    return obj;
  };
  const buildArgTypeCache = (func, arr) => {
    // get the if an argument tree for current function already exists
    let obj = argumentTree[func];
    if (obj === undefined) {
      // if it doesn't, create an empty tree
      obj = argumentTree[func] = {};
    }

    for (let i = 0, len = arr.length; i < len; ++i) {
      let value = arr[i];
      if (value instanceof Array) {
        // an array is passed as an argument, expand it and get the type of
        // each of its element. We distinguish the start of an array with 'as'
        // or arraystart. This would help distinguish between the arguments
        // (number, number, number) and (number, [number, number])
        obj = obj['as'] || (obj['as'] = {});
        for (let j = 0, lenA = value.length; j < lenA; ++j) {
          obj = addType(value[j], obj, func);
        }
      } else {
        obj = addType(value, obj, func);
      }
    }
    return obj;
  };

  // validateParameters() helper functions:
  // lookupParamDoc() for querying data.json
  const lookupParamDoc = func => {
    // look for the docs in the `data.json` datastructure

    const ichDot = func.lastIndexOf('.');
    const funcName = func.substr(ichDot + 1);
    const funcClass = func.substr(0, ichDot) || 'p5';

    const classitems = arrDoc;
    let queryResult = classitems[funcClass][funcName];

    // different JSON structure for funct with multi-format
    const overloads = [];
    if (queryResult.hasOwnProperty('overloads')) {
      // add all the overloads
      for (let i = 0; i < queryResult.overloads.length; i++) {
        overloads.push({ formats: queryResult.overloads[i].params });
      }
    } else {
      // no overloads, just add the main method definition
      overloads.push({ formats: queryResult.params || [] });
    }

    // parse the parameter types for each overload
    const mapConstants = {};
    let maxParams = 0;
    overloads.forEach(overload => {
      const formats = overload.formats;

      // keep a record of the maximum number of arguments
      // this method requires.
      if (maxParams < formats.length) {
        maxParams = formats.length;
      }

      // calculate the minimum number of arguments
      // this overload requires.
      let minParams = formats.length;
      while (minParams > 0 && formats[minParams - 1].optional) {
        minParams--;
      }
      overload.minParams = minParams;

      // loop through each parameter position, and parse its types
      formats.forEach(format => {
        // split this parameter's types
        format.types = format.type.split('|').map(function ct(type) {
          // array
          if (type.substr(type.length - 2, 2) === '[]') {
            return {
              name: type,
              array: ct(type.substr(0, type.length - 2))
            };
          }

          let lowerType = type.toLowerCase();

          // contant
          if (lowerType === 'constant') {
            let constant;
            if (mapConstants.hasOwnProperty(format.name)) {
              constant = mapConstants[format.name];
            } else {
              // parse possible constant values from description
              const myRe = /either\s+(?:[A-Z0-9_]+\s*,?\s*(?:or)?\s*)+/g;
              const values = {};
              const names = [];

              constant = mapConstants[format.name] = {
                values,
                names
              };

              const myArray = myRe.exec(format.description);
              if (func === 'endShape' && format.name === 'mode') {
                values[constants.CLOSE] = true;
                names.push('CLOSE');
              } else {
                const match = myArray[0];
                const reConst = /[A-Z0-9_]+/g;
                let matchConst;
                while ((matchConst = reConst.exec(match)) !== null) {
                  const name = matchConst[0];
                  if (constants.hasOwnProperty(name)) {
                    values[constants[name]] = true;
                    names.push(name);
                  }
                }
              }
            }
            return {
              name: type,
              builtin: lowerType,
              names: constant.names,
              values: constant.values
            };
          }

          // function
          if (lowerType.substr(0, 'function'.length) === 'function') {
            lowerType = 'function';
          }
          // builtin
          if (builtinTypes.has(lowerType)) {
            return { name: type, builtin: lowerType };
          }

          // find type's prototype
          let t = window;
          const typeParts = type.split('.');

          // special-case 'p5' since it may be non-global
          if (typeParts[0] === 'p5') {
            t = p5;
            typeParts.shift();
          }

          typeParts.forEach(p => {
            t = t && t[p];
          });
          if (t) {
            return { name: type, prototype: t };
          }

          return { name: type, type: lowerType };
        });
      });
    });
    return {
      overloads,
      maxParams
    };
  };

  const isNumber = param => {
    switch (typeof param) {
      case 'number':
        return true;
      case 'string':
        return !isNaN(param);
      default:
        return false;
    }
  };

  const testParamType = (param, type) => {
    const isArray = param instanceof Array;
    let matches = true;
    if (type.array && isArray) {
      for (let i = 0; i < param.length; i++) {
        const error = testParamType(param[i], type.array);
        if (error) return error / 2; // half error for elements
      }
    } else if (type.prototype) {
      matches = param instanceof type.prototype;
    } else if (type.builtin) {
      switch (type.builtin) {
        case 'number':
          matches = isNumber(param);
          break;
        case 'integer':
          matches = isNumber(param) && Number(param) === Math.floor(param);
          break;
        case 'boolean':
        case 'any':
          matches = true;
          break;
        case 'array':
          matches = isArray;
          break;
        case 'string':
          matches = /*typeof param === 'number' ||*/ typeof param === 'string';
          break;
        case 'constant':
          matches = type.values.hasOwnProperty(param);
          break;
        case 'function':
          matches = param instanceof Function;
          break;
        case 'null':
          matches = param === null;
          break;
      }
    } else {
      matches = typeof param === type.t;
    }
    return matches ? 0 : 1;
  };

  // testType() for non-object type parameter validation
  const testParamTypes = (param, types) => {
    let minScore = 9999;
    for (let i = 0; minScore > 0 && i < types.length; i++) {
      const score = testParamType(param, types[i]);
      if (minScore > score) minScore = score;
    }
    return minScore;
  };

  // generate a score (higher is worse) for applying these args to
  // this overload.
  const scoreOverload = (args, argCount, overload, minScore) => {
    let score = 0;
    const formats = overload.formats;
    const minParams = overload.minParams;

    // check for too few/many args
    // the score is double number of extra/missing args
    if (argCount < minParams) {
      score = (minParams - argCount) * 2;
    } else if (argCount > formats.length) {
      score = (argCount - formats.length) * 2;
    }

    // loop through the formats, adding up the error score for each arg.
    // quit early if the score gets higher than the previous best overload.
    for (let p = 0; score <= minScore && p < formats.length; p++) {
      const arg = args[p];
      const format = formats[p];
      // '== null' checks for 'null' and typeof 'undefined'
      if (arg == null) {
        // handle non-optional and non-trailing undefined args
        if (!format.optional || p < minParams || p < argCount) {
          score += 1;
        }
      } else {
        score += testParamTypes(arg, format.types);
      }
    }
    return score;
  };

  // gets a list of errors for this overload
  const getOverloadErrors = (args, argCount, overload) => {
    const formats = overload.formats;
    const minParams = overload.minParams;

    // check for too few/many args
    if (argCount < minParams) {
      return [
        {
          type: 'TOO_FEW_ARGUMENTS',
          argCount,
          minParams
        }
      ];
    } else if (argCount > formats.length) {
      return [
        {
          type: 'TOO_MANY_ARGUMENTS',
          argCount,
          maxParams: formats.length
        }
      ];
    }

    const errorArray = [];
    for (let p = 0; p < formats.length; p++) {
      const arg = args[p];
      const format = formats[p];
      // '== null' checks for 'null' and typeof 'undefined'
      if (arg == null) {
        // handle non-optional and non-trailing undefined args
        if (!format.optional || p < minParams || p < argCount) {
          errorArray.push({
            type: 'EMPTY_VAR',
            position: p,
            format
          });
        }
      } else if (testParamTypes(arg, format.types) > 0) {
        errorArray.push({
          type: 'WRONG_TYPE',
          position: p,
          format,
          arg
        });
      }
    }

    return errorArray;
  };

  // a custom error type, used by the mocha
  // tests when expecting validation errors
  p5.ValidationError = (name => {
    class err extends Error {
      constructor(message, func) {
        super();
        this.message = message;
        this.func = func;
        if ('captureStackTrace' in Error) Error.captureStackTrace(this, err);
        else this.stack = new Error().stack;
      }
    }

    err.prototype.name = name;
    return err;
  })('ValidationError');

  // function for generating console.log() msg
  p5._friendlyParamError = function(errorObj, func) {
    let message;

    function formatType() {
      const format = errorObj.format;
      return format.types
        .map(type => (type.names ? type.names.join('|') : type.name))
        .join('|');
    }

    switch (errorObj.type) {
      case 'EMPTY_VAR': {
        message = `${func}() was expecting ${formatType()} for parameter #${
          errorObj.position
        } (zero-based index), received an empty variable instead. If not intentional, this is often a problem with scope: [https://p5js.org/examples/data-variable-scope.html]`;
        break;
      }
      case 'WRONG_TYPE': {
        const arg = errorObj.arg;
        const argType =
          arg instanceof Array
            ? 'array'
            : arg === null ? 'null' : arg.name || typeof arg;
        message = `${func}() was expecting ${formatType()} for parameter #${
          errorObj.position
        } (zero-based index), received ${argType} instead`;
        break;
      }
      case 'TOO_FEW_ARGUMENTS': {
        message = `${func}() was expecting at least ${
          errorObj.minParams
        } arguments, but received only ${errorObj.argCount}`;
        break;
      }
      case 'TOO_MANY_ARGUMENTS': {
        message = `${func}() was expecting no more than ${
          errorObj.maxParams
        } arguments, but received ${errorObj.argCount}`;
        break;
      }
    }

    if (message) {
      if (p5._throwValidationErrors) {
        throw new p5.ValidationError(message);
      }

      try {
        const re = /Function\.validateParameters.*[\r\n].*[\r\n].*\(([^)]*)/;
        const location = re.exec(new Error().stack)[1];
        if (location) {
          message += ` at ${location}`;
        }
      } catch (err) {}

      report(`${message}.`, func, 3);
    }
  };

  // if a function is called with some set of wrong arguments, and then called
  // again with the same set of arguments, the messages due to the second call
  // will be supressed. If two tests test on the same wrong arguments, the
  // second test won't see the validationError. clearing argumentTree solves it
  p5._clearValidateParamsCache = function clearValidateParamsCache() {
    for (let key of Object.keys(argumentTree)) {
      delete argumentTree[key];
    }
  };

  // allowing access to argumentTree for testing
  p5._getValidateParamsArgTree = function getValidateParamsArgTree() {
    return argumentTree;
  };

  /**
   * Validates parameters
   * param  {String}               func    the name of the function
   * param  {Array}                args    user input arguments
   *
   * example:
   *  const a;
   *  ellipse(10,10,a,5);
   * console ouput:
   *  "It looks like ellipse received an empty variable in spot #2."
   *
   * example:
   *  ellipse(10,"foo",5,5);
   * console output:
   *  "ellipse was expecting a number for parameter #1,
   *           received "foo" instead."
   */
  p5._validateParameters = function validateParameters(func, args) {
    if (p5.disableFriendlyErrors) {
      return; // skip FES
    }

    // query / build the argument type tree and check if this sequence
    // has already been seen before.
    let obj = buildArgTypeCache(func, args);
    if (obj.seen) {
      return;
    }
    // mark this sequence as seen
    obj.seen = true;
    // lookup the docs in the 'data.json' file
    const docs = docCache[func] || (docCache[func] = lookupParamDoc(func));
    const overloads = docs.overloads;

    // ignore any trailing `undefined` arguments
    let argCount = args.length;
    // '== null' checks for 'null' and typeof 'undefined'
    while (argCount > 0 && args[argCount - 1] == null) argCount--;

    // find the overload with the best score
    let minScore = 99999;
    let minOverload;
    for (let i = 0; i < overloads.length; i++) {
      const score = scoreOverload(args, argCount, overloads[i], minScore);
      if (score === 0) {
        return; // done!
      } else if (minScore > score) {
        // this score is better that what we have so far...
        minScore = score;
        minOverload = i;
      }
    }

    // this should _always_ be true here...
    if (minScore > 0) {
      // get the errors for the best overload
      const errorArray = getOverloadErrors(
        args,
        argCount,
        overloads[minOverload]
      );

      // generate err msg
      for (let n = 0; n < errorArray.length; n++) {
        p5._friendlyParamError(errorArray[n], func);
      }
    }
  };

  /**
   * Prints out all the colors in the color pallete with white text.
   * For color blindness testing.
   */
  /* function testColors() {
    const str = 'A box of biscuits, a box of mixed biscuits and a biscuit mixer';
    report(str, 'print', '#ED225D'); // p5.js magenta
    report(str, 'print', '#2D7BB6'); // p5.js blue
    report(str, 'print', '#EE9900'); // p5.js orange
    report(str, 'print', '#A67F59'); // p5.js light brown
    report(str, 'print', '#704F21'); // p5.js gold
    report(str, 'print', '#1CC581'); // auto cyan
    report(str, 'print', '#FF6625'); // auto orange
    report(str, 'print', '#79EB22'); // auto green
    report(str, 'print', '#B40033'); // p5.js darkened magenta
    report(str, 'print', '#084B7F'); // p5.js darkened blue
    report(str, 'print', '#945F00'); // p5.js darkened orange
    report(str, 'print', '#6B441D'); // p5.js darkened brown
    report(str, 'print', '#2E1B00'); // p5.js darkened gold
    report(str, 'print', '#008851'); // auto dark cyan
    report(str, 'print', '#C83C00'); // auto dark orange
    report(str, 'print', '#4DB200'); // auto dark green
  } */

  p5.prototype._validateParameters = p5.validateParameters;
}

// This is a lazily-defined list of p5 symbols that may be
// misused by beginners at top-level code, outside of setup/draw. We'd like
// to detect these errors and help the user by suggesting they move them
// into setup/draw.
//
// For more details, see https://github.com/processing/p5.js/issues/1121.
let misusedAtTopLevelCode = null;
const FAQ_URL =
  'https://github.com/processing/p5.js/wiki/p5.js-overview#why-cant-i-assign-variables-using-p5-functions-and-variables-before-setup';

const defineMisusedAtTopLevelCode = () => {
  const uniqueNamesFound = {};

  const getSymbols = obj =>
    Object.getOwnPropertyNames(obj)
      .filter(name => {
        if (name[0] === '_') {
          return false;
        }
        if (name in uniqueNamesFound) {
          return false;
        }

        uniqueNamesFound[name] = true;

        return true;
      })
      .map(name => {
        let type;

        if (typeof obj[name] === 'function') {
          type = 'function';
        } else if (name === name.toUpperCase()) {
          type = 'constant';
        } else {
          type = 'variable';
        }

        return { name, type };
      });

  misusedAtTopLevelCode = [].concat(
    getSymbols(p5.prototype),
    // At present, p5 only adds its constants to p5.prototype during
    // construction, which may not have happened at the time a
    // ReferenceError is thrown, so we'll manually add them to our list.
    getSymbols(require('./constants'))
  );

  // This will ultimately ensure that we report the most specific error
  // possible to the user, e.g. advising them about HALF_PI instead of PI
  // when their code misuses the former.
  misusedAtTopLevelCode.sort((a, b) => b.name.length - a.name.length);
};

const helpForMisusedAtTopLevelCode = (e, log) => {
  if (!log) {
    log = console.log.bind(console);
  }

  if (!misusedAtTopLevelCode) {
    defineMisusedAtTopLevelCode();
  }

  // If we find that we're logging lots of false positives, we can
  // uncomment the following code to avoid displaying anything if the
  // user's code isn't likely to be using p5's global mode. (Note that
  // setup/draw are more likely to be defined due to JS function hoisting.)
  //
  //if (!('setup' in window || 'draw' in window)) {
  //  return;
  //}

  misusedAtTopLevelCode.some(symbol => {
    // Note that while just checking for the occurrence of the
    // symbol name in the error message could result in false positives,
    // a more rigorous test is difficult because different browsers
    // log different messages, and the format of those messages may
    // change over time.
    //
    // For example, if the user uses 'PI' in their code, it may result
    // in any one of the following messages:
    //
    //   * 'PI' is undefined                           (Microsoft Edge)
    //   * ReferenceError: PI is undefined             (Firefox)
    //   * Uncaught ReferenceError: PI is not defined  (Chrome)

    if (e.message && e.message.match(`\\W?${symbol.name}\\W`) !== null) {
      const symbolName =
        symbol.type === 'function' ? `${symbol.name}()` : symbol.name;
      if (typeof IS_MINIFIED !== 'undefined') {
        log(
          `Did you just try to use p5.js's ${symbolName} ${
            symbol.type
          }? If so, you may want to move it into your sketch's setup() function.\n\nFor more details, see: ${FAQ_URL}`
        );
      } else {
        log(
          translator('fes.misusedTopLevel', {
            symbolName,
            symbolType: symbol.type,
            link: FAQ_URL
          })
        );
      }
      return true;
    }
  });
};

// Exposing this primarily for unit testing.
p5.prototype._helpForMisusedAtTopLevelCode = helpForMisusedAtTopLevelCode;

if (document.readyState !== 'complete') {
  window.addEventListener('error', helpForMisusedAtTopLevelCode, false);

  // Our job is only to catch ReferenceErrors that are thrown when
  // global (non-instance mode) p5 APIs are used at the top-level
  // scope of a file, so we'll unbind our error listener now to make
  // sure we don't log false positives later.
  window.addEventListener('load', () => {
    window.removeEventListener('error', helpForMisusedAtTopLevelCode, false);
  });
}

export default p5;
