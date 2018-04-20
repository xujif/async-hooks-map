export class AsyncScope<K, V> {

    readonly asyncId!: number
    protected _children?: Map<number, AsyncScope<K, V>>
    protected _map?: Map<K, V>

    protected _parent?: AsyncScope<K, V>
    protected _destroyCb?: (asyncId: number) => void
    protected _nameSet?: Set<string>

    constructor(asyncId: number, parent?: AsyncScope<K, V>) {
        this._parent = parent
        if (parent) {
            if (!parent._children) {
                parent._children = new Map()
            }
            parent._children.set(asyncId, this)
        }
        this.asyncId = asyncId
    }


    hasName (name: string) {
        return this._nameSet && this._nameSet.has(name)
    }

    alias (name: string): this {
        if (!this._nameSet) {
            this._nameSet = new Set([name])
        } else {
            this._nameSet.add(name)
        }
        return this
    }


    //#region Map implemention

    get (key: K): V | undefined {
        let t: AsyncScope<K, V> | undefined
        for (t = this; t; t = t._parent) {
            if (t._map && t._map.has(key)) {
                return t._map.get(key)
            }
        }
    }

    has (key: K, recursion = true): boolean {
        if (!recursion) {
            return !!this._map && this._map.has(key)
        } else {
            let t: AsyncScope<K, V> | undefined
            for (t = this; t; t = t._parent) {
                if (t._map && t._map.has(key)) {
                    return true
                }
            }
            return false
        }
    }

    set (key: K, value: V): this {
        if (!this._map) {
            this._map = new Map()
        }
        this._map.set(key, value)
        return this
    }

    delete (key: K): boolean {
        if (this._map) {
            return this._map.delete(key)
        }
        return false
    }

    clear (): void {
        if (this._map) {
            this._map.clear()
        }
    }
    /**
     * get parent scope
     * if name provided , return the named closest scope
     * this method will throw an error if there is no parent
     * 
     * @param {string} [name] 
     * @returns {AsyncScope<K, V>} 
     * @memberof AsyncScope
     */
    parent (name?: string): AsyncScope<K, V> {
        if (!name) {
            if (this._parent) {
                return this._parent
            }
            throw new Error('this scope do not has parent')
        }
        let t: AsyncScope<K, V> | undefined
        for (t = this; t; t = t._parent) {
            if (t.hasName(name)) {
                return t
            }
        }
        throw new Error('cant find parent with name:' + name)
    }

    /**
     * alias of parent
     * 
     * @param {string} name 
     * @returns 
     * @memberof AsyncStorage
     */
    closest (name: string) {
        return this.parent(name)
    }


    /**
     * check if the scope has children?
     * 
     * @returns 
     * @memberof AsyncScope
     */
    hasChildren () {
        return this._children && this._children.size > 0
    }

    //#endregion

    /**
     * destroy the scope,the callback will be called when real destroyed
     * 
     * @param {(asyncId: number) => void} cb 
     * @memberof AsyncScope
     */
    destroy (cb: (cbId: number) => void) {
        if (this._parent) {
            // remove child of parent
            this._parent._children!.delete(this.asyncId)
            if (this._parent._destroyCb && !this._parent.hasChildren()) {
                // destroy parent
                this._parent.realDestroy()
            }
        }
        this._destroyCb = cb
        // if has children, wait to all children desctroy
        if (!this.hasChildren()) {
            this.realDestroy()
        }
    }

    /**
     * real destroy the scope and call the callback
     * 
     * @protected
     * @memberof AsyncScope
     */
    protected realDestroy () {
        if (this._map) {
            this._map.clear()
            delete this._map
            delete this._children
        }
        // must has destroyCb
        this._destroyCb!(this.asyncId)
    }

}

export class AsyncHookMap<K=any, V=any> {

    protected maps = new Map<number, AsyncScope<K, V>>()

    protected hook !: {
        enable (): void
        disable (): void
    }

    protected asyncHooks!: any
    /**
     * AsyncStorage
     * default backend by node 8+ async-hooks
     * @param {string} [asyncHooks=require('async_hooks')] 
     * @memberof AsyncHookMap
     */
    constructor(asyncHooks?: any) {
        this.asyncHooks = asyncHooks || require('async_hooks')
        const rootAsyncId = this.asyncHooks.executionAsyncId()
        const root = new AsyncScope<K, V>(rootAsyncId).alias('root')
        this.maps.set(rootAsyncId, root)
        this.hook = this.asyncHooks.createHook({
            init: (asyncId: number, type: string, triggerAsyncId: number) => {
                const parent = this.maps.get(triggerAsyncId)
                const scope = new AsyncScope<K, V>(asyncId, parent)
                this.maps.set(asyncId, scope)
            },
            destroy: (asyncId: number) => {
                const current = this.maps.get(asyncId)
                if (current) {
                    current.destroy((asyncId) => {
                        this.maps.delete(asyncId)
                    })
                }
            }
        }).enable()
    }

    /**
     * disable the AsyncHook,and desctroy all scope
     * 
     */
    desctroy () {
        this.hook.disable()
        this.maps.clear()
    }

    /**
     * alias of asyncHooks.executionAsyncId()
     * 
     * @returns {number} 
     */
    executionAsyncId (): number {
        return this.asyncHooks.executionAsyncId()
    }

    /**
     * add alias of scope, a scope can own multi names
     * 
     * @param {string} name 
     * @returns {this} 
     */
    alias (name: string): this {
        this.current().alias(name)
        return this
    }

    /**
     * check the alias name
     * 
     * @param {string} name 
     * @returns {this} 
     */
    hasName (name: string) {
        return this.current().alias(name).hasName(name)
    }

    /**
     * get parent scope
     * if name provided , return the named closest scope
     * this method will throw an error if there is no parent
     * 
     * @param {string} [name] 
     * @returns {TinyMap<K, V>} 
     * @memberof AsyncStorageInterface
     */
    parent (name?: string): AsyncScope<K, V> {
        return this.current().parent(name)
    }

    /**
     * alias of parent
     * 
     * @param {string} name 
     * @returns 
     * @memberof AsyncStorage
     */
    closest (name: string) {
        return this.parent(name)
    }

    /**
     * get from AsyncStorage
     * 
     * @param {K} key 
     * @returns {(V | undefined)} 
     * @memberof AsyncStorage
     */
    get (key: K): V | undefined {
        return this.current().get(key)
    }

    /**
     * check key
     * @param key 
     * @param recursion check forefathers?
     */
    has (key: K, recursion = true) {
        return this.current().has(key, recursion)
    }

    /**
     * set value to current async scope
     * effect current scope and children
     * 
     * @param {K} key 
     * @param {V} value 
     * @returns {this} 
     * @memberof AsyncStorage
     */
    set (key: K, value: V): this {
        this.current().set(key, value)
        return this
    }

    /**
     * delete the value of current scope
     * 
     * @param {K} key 
     * @returns {boolean} 
     * @memberof AsyncStorage
     */
    delete (key: K): boolean {
        return this.current().delete(key)
    }

    /**
     * clear the current scope
     * 
     * @memberof AsyncStorage
     */
    clear (): void {
        this.current().clear()
    }


    protected current () {
        const asyncId = this.asyncHooks.executionAsyncId()
        return this.maps.get(asyncId)!
    }
}

export default AsyncHookMap