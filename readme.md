[![NPM version][npm-image]][npm-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]
[![npm license][license-image]][download-url]
### A Thread-local storage (TLS) like Map implementation, base on node async hooks, support nodejs & typescript

- #### thread local support for nodejs & typescript
- #### named scope & chain support , easily to get closest forefather scope
- #### browser or lower version of node if provided an async-hooks implementation with constructor

### tips
- .get(key: K) will find the key recursive
- A scope can have multiple names
- Top scope is named 'root' by default

## install
```
npm install async-hooks-storage
```

## import
```javascript
const { AsyncHookMap } = require('async-hooks-storage')
// or import a global instance
//const scope = require('async-hooks-storage/global')

```
## Usage

typescript: 
```typescript
    import { AsyncHookMap } from 'async-hooks-storage'
    const scope = new AsyncHookMap()

    Promise.resolve().then(() => {
        scope.set('aa', 'first')
        scope.alias('ccc')
        assert.equal(scope.get('aa'), 'first')
        return Promise.resolve().then(() => {
            assert(scope.has('aa'), 'should has the key')
            assert(!scope.has('not'), 'should not has the key')
            assert(!scope.has('aa', false), 'should not has the key in this scope')
            assert.equal(scope.get('aa'), 'first')
            scope.set('aa', 'second')
            assert.equal(scope.get('aa'), 'second')
        }).then(() => {
            assert.equal(scope.get('aa'), 'second')
            assert.equal(scope.parent('ccc').get('aa'), 'first')
            // 'root' as alias of 'ccc'
            assert.equal(scope.parent('root').get('aa'), 'first')
            scope.parent().delete('aa')
            // parent scope 'aa' has been delete, 'aa' will be first
            assert.equal(scope.get('aa'), 'first')
            scope.parent('ccc').set('bb', 'bb')
            assert.equal(scope.get('bb'), 'bb')
            scope.delete('bb')
            // can not be deleted ,because bb is set to "ccc" scope
            assert.equal(scope.get('bb'), 'bb')
        })
    })
})

```
Api:
```typescript
class AsyncHookMap<K = any, V = any> {
    /**
     * AsyncStorage
     * default backend by node 8+ async-hooks
     * @param {string} [asyncHooks=require('async_hooks')]
     * @memberof AsyncHookMap
     */
    constructor(asyncHooks?: any);
    /**
     * disable the AsyncHook,and desctroy all scope
     *
     */
    desctroy(): void;
    /**
     * alias of asyncHooks.executionAsyncId()
     *
     * @returns {number}
     */
    executionAsyncId(): number;
    /**
     * add alias of scope, a scope can own multi names
     *
     * @param {string} name
     * @returns {this}
     */
    alias(name: string): this;
    /**
     * check the alias name
     *
     * @param {string} name
     * @returns {this}
     */
    hasName(name: string): boolean | undefined;
    /**
     * get parent scope
     * if name provided , return the named closest scope
     * this method will throw an error if there is no parent
     *
     * @param {string} [name]
     * @returns {TinyMap<K, V>}
     * @memberof AsyncStorageInterface
     */
    parent(name?: string): AsyncScope<K, V>;
    /**
     * alias of parent
     *
     * @param {string} name
     * @returns
     * @memberof AsyncStorage
     */
    closest(name: string): AsyncScope<K, V>;
    /**
     * get from AsyncStorage
     *
     * @param {K} key
     * @returns {(V | undefined)}
     * @memberof AsyncStorage
     */
    get(key: K): V | undefined;
    /**
     * check key
     * @param key
     * @param recursion check forefathers?
     */
    has(key: K, recursion?: boolean): boolean;
    /**
     * set value to current async scope
     * effect current scope and children
     *
     * @param {K} key
     * @param {V} value
     * @returns {this}
     * @memberof AsyncStorage
     */
    set(key: K, value: V): this;
    /**
     * delete the value of current scope
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof AsyncStorage
     */
    delete(key: K): boolean;
    /**
     * clear the current scope
     *
     * @memberof AsyncStorage
     */
    clear(): void;
}

```


[npm-image]: https://img.shields.io/npm/v/async-hooks-storage.svg?style=flat-square
[npm-url]: https://npmjs.org/package/async-hooks-storage
[travis-image]: https://img.shields.io/travis/https://github.com/xujif/async-hooks-storage.svg?style=flat-square
[travis-url]: https://travis-ci.org/https://github.com/xujif/async-hooks-storage
[coveralls-image]: https://img.shields.io/coveralls/https://github.com/xujif/async-hooks-storage.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/https://github.com/xujif/async-hooks-storage?branch=master
[david-image]: https://img.shields.io/david/https://github.com/xujif/async-hooks-storage.svg?style=flat-square
[david-url]: https://david-dm.org/https://github.com/xujif/async-hooks-storage
[node-image]: https://img.shields.io/badge/node.js-%3E=_8.6.0-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/async-hooks-storage.svg?style=flat-square
[download-url]: https://npmjs.org/package/async-hooks-storage
[license-image]: https://img.shields.io/npm/l/async-hooks-storage.svg