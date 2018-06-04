import 'mocha';

import assert from 'assert';

import { AsyncHookMap } from '../main';

// function print (...args: any[]) {
//     require('fs').writeFileSync(1, args.map(s => JSON.stringify(s)).join(' ') + '\n')
// }

describe('Test AsyncHookMap', () => {
    it('simple', () => {
        const scope = new AsyncHookMap()
        scope.set('aa', 11)
        const aa = scope.get('aa')
        assert(aa === 11, 'should be equal')
        process.nextTick(() => {
            assert(scope.get('aa') === 11, 'should be equal')
        })
    })
    it('test async scopes', async () => {
        return Promise.resolve().then(() => {
            const scope = new AsyncHookMap()
            scope.set('aa', 'first')
            scope.alias('ccc')
            assert.equal(scope.get('aa'), 'first')
            return Promise.all([
                Promise.resolve().then(() => {
                    assert.equal(scope.get('aa'), 'first')
                    scope.set('aa', 'second')
                    assert.equal(scope.get('aa'), 'second')
                }),
                Promise.resolve().then(() => {
                    assert.equal(scope.get('aa'), 'first', 'should not overwrite by another scope')
                }),
            ])
        })
    })
    it('test named scopes and advance usages', async () => {
        return Promise.resolve().then(() => {
            const scope = new AsyncHookMap()
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
                scope.parent()!.delete('aa')
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
});

