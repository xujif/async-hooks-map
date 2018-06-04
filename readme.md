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
npm install async-hooks-map
```

## import
```javascript
const { AsyncHookMap } = require('async-hooks-map')
// or import a global instance
//const scope = require('async-hooks-map/global')

```
## Usage

typescript: 
```typescript
    import { AsyncHookMap } from 'async-hooks-map'
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
            assert.equal(scope.closest('ccc').get('aa'), 'first')
            // 'root' as alias of 'ccc'
            assert.equal(scope.closest('root').get('aa'), 'first')
            scope.closest().delete('aa')
            // parent scope 'aa' has been delete, 'aa' will be first
            assert.equal(scope.get('aa'), 'first')
            scope.closest('ccc').set('bb', 'bb')
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
export interface AsyncMapNode<K, V> {
    hasName (name: string): boolean
    alias (name: string): this
    parent (name?: string): AsyncMapNode<K, V> | undefined
    closest (name: string): AsyncMapNode<K, V>
    has (key: K, recurse?: boolean): boolean
    get (key: K): V | undefined
    set (key: K, value: V): this
    clear (): void
    delete (key: K): boolean
}
```


[npm-image]: https://img.shields.io/npm/v/async-hooks-map.svg?style=flat-square
[npm-url]: https://npmjs.org/package/async-hooks-map
[travis-image]: https://img.shields.io/travis/https://github.com/xujif/async-hooks-map.svg?style=flat-square
[travis-url]: https://travis-ci.org/https://github.com/xujif/async-hooks-map
[coveralls-image]: https://img.shields.io/coveralls/https://github.com/xujif/async-hooks-map.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/https://github.com/xujif/async-hooks-map?branch=master
[david-image]: https://img.shields.io/david/https://github.com/xujif/async-hooks-map.svg?style=flat-square
[david-url]: https://david-dm.org/https://github.com/xujif/async-hooks-map
[node-image]: https://img.shields.io/badge/node.js-%3E=_8.6.0-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/async-hooks-map.svg?style=flat-square
[download-url]: https://npmjs.org/package/async-hooks-map
[license-image]: https://img.shields.io/npm/l/async-hooks-map.svg